import { useState, useEffect, useRef } from 'react';
import { SbcProvider, WalletButton, useSbcApp, useUserOperation } from '@stablecoin.xyz/react';
import { base } from 'viem/chains';
import { createPublicClient, http, getAddress, parseSignature, WalletClient, PublicClient } from 'viem';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import './App.css';

// Import components
import TaskSubmit from './components/TaskSubmit';
import AgentActivity, { AgentState } from './components/AgentActivity';
import ResultDisplay from './components/ResultDisplay';
import StatusBar from './components/StatusBar';
import SwapInterface from './components/SwapInterface';
import TransactionExplorer from './components/TransactionExplorer';
import HomePage from './components/HomePage';
import Marketplace, { MarketplaceTool } from './components/Marketplace';

// Import API service
import * as api from './services/api';
import { TaskResult } from './services/api';

// Force Base Mainnet
const chain = base;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const SBC_TOKEN_ADDRESS = '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
const SBC_DECIMALS = 18;
const chainExplorer = 'https://basescan.org';

// Recipient address for payments (configurable via env)
const PAYMENT_RECIPIENT = import.meta.env.VITE_PAYMENT_RECIPIENT || '0x0000000000000000000000000000000000000000';

const publicClient = createPublicClient({ 
  chain, 
  transport: http(rpcUrl || "https://base-rpc.publicnode.com") 
});

const erc20PermitAbi = [
  ...erc20Abi,
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "nonces",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const permitAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "uint8", "name": "v", "type": "uint8" },
      { "internalType": "bytes32", "name": "r", "type": "bytes32" },
      { "internalType": "bytes32", "name": "s", "type": "bytes32" }
    ],
    "name": "permit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Helper to get permit signature
async function getPermitSignature({
  publicClient,
  walletClient,
  owner,
  spender,
  value,
  tokenAddress,
  chainId,
  deadline,
}: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  owner: string;
  spender: string;
  value: bigint;
  tokenAddress: string;
  chainId: number;
  deadline: number;
}): Promise<`0x${string}` | null> {
  try {
    const ownerChecksum = getAddress(owner);
    const spenderChecksum = getAddress(spender);
    
    const nonce = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20PermitAbi,
      functionName: 'nonces',
      args: [ownerChecksum],
    });
    
    const tokenName = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20PermitAbi,
      functionName: 'name',
    });
    
    const domain = {
      name: tokenName as string,
      version: '1',
      chainId: BigInt(chainId),
      verifyingContract: tokenAddress as `0x${string}`,
    };
    
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const;
    
    const message = {
      owner: ownerChecksum,
      spender: spenderChecksum,
      value: value,
      nonce: nonce as bigint,
      deadline: BigInt(deadline),
    };
    
    const signature = await walletClient.signTypedData({
      account: ownerChecksum,
      domain,
      types,
      primaryType: 'Permit',
      message,
    });

    return signature;
  } catch (e) {
    console.error('Error in getPermitSignature:', e);
    return null;
  }
}

// Convert USD to SBC (assuming 1 SBC = 1 USD for simplicity)
function usdToSbc(usdAmount: number): bigint {
  return parseUnits(usdAmount.toFixed(6), SBC_DECIMALS);
}

function WalletStatus({ onDisconnect }: { onDisconnect: () => void }) {
  const { ownerAddress } = useSbcApp();

  if (!ownerAddress) return null;

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="wallet-badge">
      <div className="wallet-info">
        <div className="status-dot"></div>
        <span className="wallet-address">{formatAddress(ownerAddress)}</span>
        <span className="chain-badge">BASE</span>
      </div>
      <button onClick={onDisconnect} className="disconnect-icon" title="Disconnect Wallet">
        ⏏
      </button>
    </div>
  );
}

function MainApp() {
  const { ownerAddress, account, sbcAppKit, disconnectWallet, refreshAccount } = useSbcApp();
  const { sendUserOperation, isLoading: isPaymentLoading, isSuccess: isPaymentSuccess, data: paymentData } = useUserOperation();
  const prevOwnerAddress = useRef<string | null>(null);
  const paymentTriggeredRef = useRef<string | null>(null); // Track if payment was triggered for this result
  
  const [agents, setAgents] = useState<AgentState[]>([
    { name: 'RequirementsAgent', backendName: 'requirements_agent', status: 'idle', activity: 'Ready', progress: 0 },
    { name: 'ContextAgent', backendName: 'context_agent', status: 'idle', activity: 'Ready', progress: 0 },
    { name: 'BuilderAgent', backendName: 'builder_agent', status: 'idle', activity: 'Ready', progress: 0 },
    { name: 'QualityAgent', backendName: 'quality_agent', status: 'idle', activity: 'Ready', progress: 0 },
    { name: 'EscalationAgent', backendName: 'escalation_agent', status: 'idle', activity: 'Ready', progress: 0 }
  ]);
  
  const [systemStatus, setSystemStatus] = useState({
    status: 'loading',
    swarm_available: false,
    agents_count: 5,
  });
  
  const [currentResult, setCurrentResult] = useState<TaskResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'agents' | 'swap' | 'explorer'>('agents');
  const [currentView, setCurrentView] = useState<'home' | 'marketplace' | 'tool'>('home');

  const walletClient = (sbcAppKit as any)?.walletClient;

  // Refresh account when wallet connects
  useEffect(() => {
    if (ownerAddress && !prevOwnerAddress.current) {
      refreshAccount();
    }
    prevOwnerAddress.current = ownerAddress;
  }, [ownerAddress, refreshAccount]);

  // Load system status
  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to load status:', err);
      setSystemStatus({ status: 'offline', swarm_available: false, agents_count: 5 });
    }
  };

  const resetAgents = () => {
    setAgents([
      { name: 'RequirementsAgent', backendName: 'requirements_agent', status: 'idle', activity: 'Ready', progress: 0 },
      { name: 'ContextAgent', backendName: 'context_agent', status: 'idle', activity: 'Ready', progress: 0 },
      { name: 'BuilderAgent', backendName: 'builder_agent', status: 'idle', activity: 'Ready', progress: 0 },
      { name: 'QualityAgent', backendName: 'quality_agent', status: 'idle', activity: 'Ready', progress: 0 },
      { name: 'EscalationAgent', backendName: 'escalation_agent', status: 'idle', activity: 'Ready', progress: 0 }
    ]);
  };

  const simulateAgentActivity = () => {
    const sequence = [
      { name: 'RequirementsAgent', activity: 'Analyzing requirements...', delay: 0 },
      { name: 'ContextAgent', activity: 'Gathering context...', delay: 800 },
      { name: 'BuilderAgent', activity: 'Writing code...', delay: 1600 },
      { name: 'QualityAgent', activity: 'Running tests...', delay: 2400 },
      { name: 'EscalationAgent', activity: 'Making decision...', delay: 3200 }
    ];

    sequence.forEach(({ name, activity, delay }) => {
      setTimeout(() => {
        setAgents(prev => prev.map(a =>
          a.name === name ? { ...a, status: 'working', activity, progress: 50 } : a
        ));
      }, delay);

      setTimeout(() => {
        setAgents(prev => prev.map(a =>
          a.name === name ? { ...a, status: 'completed', activity: 'Complete', progress: 100 } : a
        ));
      }, delay + 600);
    });
  };

  const updateAgentsFromResult = (result: TaskResult) => {
    if (result.agent_sequence && result.agent_sequence.length > 0) {
      setAgents(prev => prev.map(agent => {
        const wasInvolved = result.agent_sequence.includes(agent.name) ||
                           result.agent_sequence.includes(agent.backendName);

        if (wasInvolved) {
          const agentOutput = result.agent_outputs?.[agent.name] ||
                            result.agent_outputs?.[agent.backendName];
          const activity = agentOutput?.handoff_message ||
                          agentOutput?.response?.substring(0, 80) ||
                          'Completed';

          return {
            ...agent,
            status: 'completed' as const,
            activity: activity.substring(0, 50),
            progress: 100
          };
        }
        return { ...agent, status: 'idle' as const, activity: 'Not involved', progress: 0 };
      }));
    }
  };

  const handlePayment = async (paymentAmount: number) => {
    console.log('💰 handlePayment called with amount:', paymentAmount);
    console.log('📍 Payment recipient:', PAYMENT_RECIPIENT);
    console.log('👛 Wallet info:', { ownerAddress, accountAddress: account?.address });

    if (!account || !ownerAddress || !walletClient) {
      setPaymentStatus('❌ Wallet not connected');
      console.error('Wallet not connected:', { account, ownerAddress, walletClient });
      return;
    }

    if (PAYMENT_RECIPIENT === '0x0000000000000000000000000000000000000000') {
      setPaymentStatus('⚠️ Payment recipient not configured');
      console.warn('Set VITE_PAYMENT_RECIPIENT in .env file');
      return;
    }

    try {
      setPaymentStatus('💳 Preparing payment transaction...');
      
      const ownerChecksum = getAddress(ownerAddress);
      const spenderChecksum = getAddress(account.address);
      const value = usdToSbc(paymentAmount);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
      
      console.log('📝 Payment details:', {
        from: ownerChecksum,
        to: PAYMENT_RECIPIENT,
        amount: paymentAmount,
        sbcAmount: value.toString(),
        smartAccount: spenderChecksum,
        deadline: new Date(deadline * 1000).toISOString()
      });
      
      setPaymentStatus('🖊️ Please sign the permit in your wallet...');
      console.log('✍️ Requesting permit signature...');
      
      const signature = await getPermitSignature({
        publicClient: publicClient as PublicClient,
        walletClient: walletClient as WalletClient,
        owner: ownerChecksum,
        spender: spenderChecksum,
        value,
        tokenAddress: SBC_TOKEN_ADDRESS,
        chainId: chain.id,
        deadline,
      });

      if (!signature) {
        setPaymentStatus('❌ Failed to sign permit');
        console.error('Failed to get signature');
        return;
      }
      
      console.log('✅ Signature received');
      const { r, s, v } = parseSignature(signature);
      
      const permitCallData = encodeFunctionData({
        abi: permitAbi,
        functionName: 'permit',
        args: [ownerChecksum, spenderChecksum, value, deadline, v, r, s],
      });
      
      const transferFromCallData = encodeFunctionData({
        abi: erc20PermitAbi,
        functionName: 'transferFrom',
        args: [ownerChecksum, PAYMENT_RECIPIENT as `0x${string}`, value],
      });
      
      setPaymentStatus('⏳ Sending gasless transaction...');
      console.log('📤 Sending user operation with 2 calls (permit + transferFrom)...');
      
      await sendUserOperation({
        calls: [
          { to: SBC_TOKEN_ADDRESS as `0x${string}`, data: permitCallData },
          { to: SBC_TOKEN_ADDRESS as `0x${string}`, data: transferFromCallData },
        ],
      });
      
      console.log('✅ User operation sent successfully!');
      
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentStatus(`❌ Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Auto-trigger payment when payment information is displayed
  useEffect(() => {
    // Check if we have a result with payment info
    if (!currentResult || !currentResult.payment || currentResult.payment.amount <= 0) {
      return;
    }

    // Check if wallet is connected
    if (!ownerAddress || !account || !walletClient) {
      console.log('⚠️ Wallet not ready for payment');
      return;
    }

    // Check if payment already triggered for this result
    const resultId = `${currentResult.task_description}_${currentResult.payment.amount}`;
    if (paymentTriggeredRef.current === resultId) {
      console.log('⏭️ Payment already triggered for this result');
      return;
    }

    // Check if payment is already in progress or completed
    if (isPaymentLoading || isPaymentSuccess) {
      return;
    }

    console.log('💰 Payment info displayed! Triggering automatic payment:', {
      amount: currentResult.payment.amount,
      currency: currentResult.payment.currency,
      wallet: ownerAddress,
    });

    // Mark this result as payment-triggered
    paymentTriggeredRef.current = resultId;
    
    // Trigger payment after 1 second to let UI update
    const timer = setTimeout(() => {
      console.log('🚀 Executing automatic SBC payment...');
      handlePayment(currentResult.payment!.amount);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentResult, ownerAddress, account, walletClient, isPaymentLoading, isPaymentSuccess]);

  // Update payment status when transaction succeeds
  useEffect(() => {
    if (isPaymentSuccess && paymentData) {
      setPaymentStatus(`✅ Payment sent! TX: ${paymentData.transactionHash}`);
    }
  }, [isPaymentSuccess, paymentData]);

  const handleTaskSubmitted = async (description: string, githubUrl?: string, requirements?: string) => {
    setError('');
    setCurrentResult(null);
    setPaymentStatus('');
    setIsProcessing(true);
    paymentTriggeredRef.current = null; // Reset payment tracking for new task

    simulateAgentActivity();

    try {
      const result = await api.processTask(description, githubUrl, requirements);
      
      setCurrentResult(result);
      updateAgentsFromResult(result);

      setTimeout(() => {
        resetAgents();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process task');
      resetAgents();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnterMarketplace = () => {
    setCurrentView('marketplace');
  };

  const handleSelectTool = (tool: MarketplaceTool) => {
    setCurrentView('tool');
    
    // Map marketplace tool to tab
    const tabMap: Record<MarketplaceTool, 'agents' | 'swap' | 'explorer'> = {
      'ai-agents': 'agents',
      'dex-swap': 'swap',
      'explorer': 'explorer'
    };
    setActiveTab(tabMap[tool]);
  };

  const handleBackToMarketplace = () => {
    setCurrentView('marketplace');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  if (!ownerAddress) {
    return (
      <div className="app">
        <header className="app-header-minimal">
          <h1>🪙 Stablecoin Agentic Marketplace</h1>
          <p className="tagline">The Future of Decentralized AI & Crypto Tools</p>
        </header>
        
        <div className="connect-wrapper">
          <div className="connect-background-orbs">
            <div className="connect-orb connect-orb-1"></div>
            <div className="connect-orb connect-orb-2"></div>
            <div className="connect-orb connect-orb-3"></div>
          </div>
          
          <div className="connect-prompt">
            <div className="connect-icon-wrapper">
              <div className="connect-icon-ring ring-1"></div>
              <div className="connect-icon-ring ring-2"></div>
              <div className="connect-icon-ring ring-3"></div>
              <svg className="wallet-icon" width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/>
                <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            
            <h2>Connect Your Wallet</h2>
            <p>Connect your wallet to access the marketplace and start using AI agents, DEX tools, and analytics</p>
            
            <div className="connect-features">
              <div className="connect-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor"/>
                </svg>
                <span>Secure & Non-Custodial</span>
              </div>
              <div className="connect-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
                </svg>
                <span>Gasless Transactions</span>
              </div>
              <div className="connect-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Instant Access</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <WalletButton
                walletType="auto"
                onConnect={refreshAccount}
                render={({ onClick, isConnecting }) => (
                  <button
                    className="wallet-connect-btn-modern"
                    onClick={onClick}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <span className="connect-spinner"></span>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect Wallet</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              />
            </div>
            
            <p className="connect-info">
              Supports MetaMask, Coinbase Wallet, WalletConnect, and more
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show home page
  if (currentView === 'home') {
    return (
      <div className="app">
        <header className="app-header-minimal">
          <div className="header-content">
            <h1>🪙 Stablecoin Agentic Marketplace</h1>
            <WalletStatus onDisconnect={disconnectWallet} />
          </div>
        </header>
        <HomePage onEnterMarketplace={handleEnterMarketplace} />
        <footer className="app-footer">
          <p>Built with Strands SDK • Powered by SBC Gasless Payments • Base Mainnet</p>
        </footer>
      </div>
    );
  }

  // Show marketplace
  if (currentView === 'marketplace') {
    return (
      <div className="app">
        <header className="app-header">
          <div className="marketplace-header-bar">
            <button className="back-button" onClick={handleBackToHome}>
              ← Home
            </button>
            <div className="header-center">
              <h1>🪙 Stablecoin Agentic Marketplace</h1>
            </div>
            <WalletStatus onDisconnect={disconnectWallet} />
          </div>
        </header>
        <main className="app-main">
          <Marketplace onSelectTool={handleSelectTool} />
        </main>
        <footer className="app-footer">
          <p>Built with Strands SDK • Powered by SBC Gasless Payments • Base Mainnet</p>
        </footer>
      </div>
    );
  }

  // Show tool view
  return (
    <div className="app">
      <header className="app-header">
        <div className="tool-header-bar">
          <button className="back-button" onClick={handleBackToMarketplace}>
            ← Marketplace
          </button>
          <div className="header-center">
            <h1>🪙 Stablecoin Agentic Marketplace</h1>
          </div>
          <WalletStatus onDisconnect={disconnectWallet} />
        </div>
        <StatusBar status={systemStatus} />
        
        {/* Tool Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => handleSelectTool('ai-agents')}
          >
            🤖 AI Agents
          </button>
          <button 
            className={`tab-button ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => handleSelectTool('dex-swap')}
          >
            🔄 Token Swap
          </button>
          <button 
            className={`tab-button ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => handleSelectTool('explorer')}
          >
            ⭐ Explorer
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {paymentStatus && (
        <div className="payment-status-banner">
          <span>{paymentStatus}</span>
          {isPaymentSuccess && paymentData && (
            <a 
              href={`${chainExplorer}/tx/${paymentData.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View TX
            </a>
          )}
        </div>
      )}

      <main className="app-main">
        {/* AI Agents Tab */}
        {activeTab === 'agents' && (
          <>
            <div className="grid-layout">
              <div className="grid-left">
                <TaskSubmit 
                  onTaskSubmitted={handleTaskSubmitted}
                  isProcessing={isProcessing}
                />
              </div>

              <div className="grid-right">
                <AgentActivity agents={agents} />
              </div>
            </div>

            {currentResult && (
              <div className="full-width">
                <ResultDisplay 
                  result={currentResult}
                />
              </div>
            )}
          </>
        )}

        {/* Token Swap Tab */}
        {activeTab === 'swap' && (
          <SwapInterface 
            onSwapComplete={(txHash) => {
              setPaymentStatus(`✅ Swap completed! TX: ${txHash}`);
            }}
          />
        )}

        {/* Transaction Explorer Tab */}
        {activeTab === 'explorer' && (
          <TransactionExplorer />
        )}
      </main>

      <footer className="app-footer">
        <p>Built with Strands SDK • Powered by SBC Gasless Payments • Base Mainnet</p>
      </footer>
    </div>
  );
}

export default function App() {
  const sbcConfig = {
    apiKey: import.meta.env.VITE_SBC_API_KEY || 'sbc-73d2b0b2ffa7117d6fdd4c5282a95f7c',
    chain,
    rpcUrl,
    wallet: 'auto' as const,
    debug: true,
    walletOptions: { autoConnect: false },
  };

  return (
    <SbcProvider config={sbcConfig}>
      <MainApp />
    </SbcProvider>
  );
}
