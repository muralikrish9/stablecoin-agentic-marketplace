/**
 * Cross-Chain Token Swap Interface using LiFi API
 * Supports swaps across Ethereum, Base, Solana, Arbitrum, Optimism, and Polygon
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { encodeFunctionData, erc20Abi, createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import * as lifi from '../services/lifi';
import TokenSelector from './TokenSelector';

interface SwapInterfaceProps {
  onSwapComplete?: (txHash: string) => void;
}

export default function SwapInterface({ onSwapComplete }: SwapInterfaceProps) {
  // Use MetaMask wallet client directly for regular transactions (not SBC SDK)
  // Memoize to prevent recreating on every render
  const walletClient = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return createWalletClient({
        chain: base,
        transport: custom((window as any).ethereum),
      });
    }
    return null;
  }, []); // Empty deps = only create once
  
  // Track if a quote fetch is in progress to prevent duplicates
  const isFetchingRef = useRef(false);

  const [fromToken, setFromToken] = useState(lifi.CROSS_CHAIN_TOKENS.BASE_SBC);
  const [toToken, setToToken] = useState(lifi.CROSS_CHAIN_TOKENS.BASE_ETH);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<lifi.Route | null>(null);
  const [error, setError] = useState('');
  const [slippage] = useState(0.5); // 0.5%
  const [isSwapping, setIsSwapping] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [isCrossChain, setIsCrossChain] = useState(false);

  // Reset amounts when tokens change
  useEffect(() => {
    setFromAmount('');
    setToAmount('');
    setCurrentRoute(null);
    setError('');
    setTxHash('');
    setNeedsApproval(false);
    setTransferStatus('');
    setIsCrossChain(fromToken.chainId !== toToken.chainId);
  }, [fromToken.address, toToken.address, fromToken.chainId, toToken.chainId]);

  // Get quote when amount changes
  useEffect(() => {
    if (!fromAmount || !walletClient || parseFloat(fromAmount) <= 0) {
      setToAmount('');
      setCurrentRoute(null);
      return;
    }

    const getQuoteDebounced = setTimeout(async () => {
      // Prevent duplicate simultaneous fetches
      if (isFetchingRef.current) {
        console.log('⏭️ Skipping duplicate quote fetch');
        return;
      }

      isFetchingRef.current = true;
      setIsLoadingQuote(true);
      setError('');

      try {
        // Get the EOA address from wallet client for the quote
        const [account] = await walletClient.getAddresses();
        if (!account) {
          setError('Wallet not connected');
          setIsLoadingQuote(false);
          isFetchingRef.current = false;
          return;
        }

        const amountInWei = lifi.toWei(fromAmount, fromToken.decimals);
        
        const quote = await lifi.getQuote({
          fromChain: fromToken.chainId,
          toChain: toToken.chainId,
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: amountInWei,
          fromAddress: account, // Use EOA address for quote
          slippage: slippage / 100,
        });

        if (quote) {
          console.log('📊 Quote received:', quote);
          setCurrentRoute(quote);
          
          const estimatedAmount = lifi.fromWei(
            quote.estimate?.toAmount || quote.toAmount || '0', 
            toToken.decimals
          );
          setToAmount(estimatedAmount);

          // Check if approval is needed for ERC-20 tokens (not needed for Solana)
          const isNativeToken = fromToken.address === '0x0000000000000000000000000000000000000000' || 
                               fromToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
                               fromToken.address.startsWith('So1'); // Solana native
          setNeedsApproval(!isNativeToken);
        } else {
          const routeInfo = `${lifi.CHAIN_NAMES[fromToken.chainId]} ${fromToken.symbol} → ${lifi.CHAIN_NAMES[toToken.chainId]} ${toToken.symbol}`;
          console.error('❌ No quote available for route:', routeInfo);
          
          // Provide more specific error message
          if (fromToken.chainId !== toToken.chainId) {
            setError(`Cross-chain route not available: ${routeInfo}. Try swapping to USDC first, or use a different token pair.`);
          } else {
            setError('Unable to get quote. Try a different amount or token pair.');
          }
          setToAmount('');
        }
      } catch (err) {
        console.error('Quote error:', err);
        setError('Failed to get quote. Check if route is supported.');
        setToAmount('');
      } finally {
        setIsLoadingQuote(false);
        isFetchingRef.current = false;
      }
    }, 800);

    return () => {
      clearTimeout(getQuoteDebounced);
      // Reset fetching flag on cleanup
      isFetchingRef.current = false;
    };
  }, [fromAmount, fromToken, toToken, walletClient, slippage]);

  const handleApproval = async () => {
    if (!currentRoute || !walletClient) {
      setError('Please connect wallet and get a quote first');
      return;
    }

    const txRequest = currentRoute.transactionRequest;
    if (!txRequest || !txRequest.to) {
      setError('No transaction data available');
      return;
    }

    try {
      setIsApproving(true);
      setError('');

      // Get the account from wallet client
      const [account] = await walletClient.getAddresses();
      if (!account) {
        setError('No wallet account found');
        return;
      }

      console.log('🔐 Approving token spend...', {
        token: fromToken.symbol,
        spender: txRequest.to,
        account,
      });

      // Approve the LiFi contract to spend tokens
      // Use a large approval amount (effectively unlimited)
      const approvalAmount = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // max uint256

      const approvalData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [txRequest.to as `0x${string}`, approvalAmount],
      });

      const hash = await walletClient.sendTransaction({
        account,
        to: fromToken.address as `0x${string}`,
        data: approvalData,
        chain: base,
      });

      console.log('✅ Approval transaction sent:', hash);
      
      // Wait a bit for the approval to be mined
      setError('⏳ Waiting for approval confirmation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setNeedsApproval(false);
      setError('');
      
    } catch (err) {
      console.error('Approval failed:', err);
      
      let errorMsg = 'Approval failed';
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          errorMsg = 'Approval rejected by user';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
    } finally {
      setIsApproving(false);
    }
  };

  // Check status for cross-chain transfers (following official LiFi example)
  const checkTransferStatus = async (hash: string, bridge: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    
    const pollStatus = async () => {
      try {
        const status = await lifi.getStatus(bridge, fromToken.chainId, toToken.chainId, hash);
        
        if (!status) {
          setTransferStatus('Unable to check status');
          return;
        }

        setTransferStatus(status.status);

        if (status.status === 'DONE') {
          console.log('✅ Cross-chain transfer complete!');
          setTransferStatus('✅ Transfer complete on destination chain');
          return;
        }

        if (status.status === 'FAILED') {
          console.error('❌ Cross-chain transfer failed');
          setError('Cross-chain transfer failed');
          return;
        }

        // Continue polling if pending
        if (status.status === 'PENDING' && attempts < maxAttempts) {
          attempts++;
          setTimeout(pollStatus, 5000); // Check every 5 seconds
        } else if (attempts >= maxAttempts) {
          setTransferStatus('⏱️ Status check timeout - transaction may still be processing');
        }

      } catch (err) {
        console.error('Error checking status:', err);
        setTransferStatus('Unable to verify transfer status');
      }
    };

    pollStatus();
  };

  const handleSwap = async () => {
    if (!currentRoute || !walletClient) {
      setError('Please connect wallet and get a quote first');
      return;
    }

    try {
      setIsSwapping(true);
      setError('');
      setTxHash('');
      setTransferStatus('');

      // Get the account from wallet client
      const [account] = await walletClient.getAddresses();
      if (!account) {
        setError('No wallet account found');
        return;
      }

      const isXChain = fromToken.chainId !== toToken.chainId;

      console.log('🔄 Executing swap:', {
        from: `${fromAmount} ${fromToken.symbol} (${lifi.CHAIN_NAMES[fromToken.chainId]})`,
        to: `${toAmount} ${toToken.symbol} (${lifi.CHAIN_NAMES[toToken.chainId]})`,
        crossChain: isXChain,
        route: currentRoute.steps?.map((s) => s.toolDetails?.name || s.tool).join(' → ') || 'Direct',
        account,
      });

      const txRequest = currentRoute.transactionRequest;
      if (!txRequest) {
        setError('No transaction data available');
        return;
      }

      // Send transaction using wallet client (following official example)
      const hash = await walletClient.sendTransaction({
        account,
        to: txRequest.to as `0x${string}`,
        data: txRequest.data as `0x${string}`,
        value: BigInt(txRequest.value || '0'),
        gas: BigInt(txRequest.gasLimit || '500000'),
        chain: base,
      });

      console.log('✅ Transaction sent:', hash);
      setTxHash(hash);
      
      // For cross-chain transfers, check status (as shown in official docs)
      if (isXChain) {
        const bridge = currentRoute.tool || currentRoute.steps?.[0]?.tool;
        if (bridge) {
          setTransferStatus('⏳ Waiting for cross-chain transfer...');
          checkTransferStatus(hash, bridge);
        }
      }
      
      if (onSwapComplete) {
        onSwapComplete(hash);
      }

      // Reset form after successful swap (longer delay for cross-chain)
      setTimeout(() => {
        if (!isXChain || transferStatus.includes('✅')) {
          setFromAmount('');
          setToAmount('');
          setCurrentRoute(null);
        }
      }, isXChain ? 10000 : 3000);

    } catch (err) {
      console.error('Swap failed:', err);
      
      let errorMsg = 'Swap failed';
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          errorMsg = 'Transaction rejected by user';
        } else if (err.message.includes('insufficient')) {
          errorMsg = 'Insufficient balance or gas';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
    } finally {
      setIsSwapping(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount('');
  };

  const formatNumber = (num: string, decimals: number = 6): string => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0';
    return n.toFixed(decimals);
  };

  const getGasCostUSD = (): string => {
    if (!currentRoute?.estimate?.gasCosts || currentRoute.estimate.gasCosts.length === 0) {
      return '~';
    }
    const totalGas = currentRoute.estimate.gasCosts.reduce((sum, cost) => {
      return sum + parseFloat(cost.amountUSD || '0');
    }, 0);
    return `$${totalGas.toFixed(2)}`;
  };

  if (!walletClient) {
    return (
      <div className="swap-interface">
        <div className="swap-card">
          <div className="swap-header">
            <h2>🔄 Cross-Chain Swap</h2>
            <p>Connect your wallet to start swapping</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-interface">
      <div className="swap-card">
        <div className="swap-header">
          <h2>🌉 Cross-Chain Swap</h2>
          <p className="swap-subtitle">Swap tokens across Ethereum, Base, Solana & more - Powered by LiFi</p>
        </div>

        {/* From Token */}
        <div className="token-input-container">
          <div className="token-input-header">
            <label>From</label>
            <button className="max-button" onClick={() => setFromAmount('1')}>
              Use 1 {fromToken.symbol}
            </button>
          </div>
          <div className="token-input-box">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              disabled={isSwapping}
              step="any"
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelectToken={(token) => setFromToken(token as any)}
              availableTokens={lifi.TOKEN_LIST}
              label="Select Source Token"
            />
          </div>
        </div>

        {/* Switch Button */}
        <div className="switch-container">
          <button className="switch-button" onClick={switchTokens} disabled={isSwapping}>
            ↓↑
          </button>
        </div>

        {/* To Token */}
        <div className="token-input-container">
          <div className="token-input-header">
            <label>To</label>
          </div>
          <div className="token-input-box">
            <input
              type="number"
              value={toAmount}
              placeholder="0.0"
              disabled
            />
            <TokenSelector
              selectedToken={toToken}
              onSelectToken={(token) => setToToken(token as any)}
              availableTokens={lifi.TOKEN_LIST}
              label="Select Destination Token"
            />
          </div>
          {isLoadingQuote && (
            <div className="loading-quote">Getting best price across chains...</div>
          )}
        </div>

        {/* Swap Details */}
        {currentRoute && toAmount && (
          <div className="swap-details">
            <div className="detail-row">
              <span>Rate</span>
              <span>
                1 {fromToken.symbol} = {formatNumber((parseFloat(toAmount) / parseFloat(fromAmount)).toString(), 4)} {toToken.symbol}
              </span>
            </div>
            <div className="detail-row">
              <span>Route</span>
              <span className="route-info">
                {lifi.CHAIN_NAMES[fromToken.chainId]} → {lifi.CHAIN_NAMES[toToken.chainId]}
              </span>
            </div>
            {currentRoute.steps?.[0]?.tool && (
              <div className="detail-row">
                <span>DEX</span>
                <span className="route-info">{currentRoute.steps[0].tool}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Slippage</span>
              <span>{slippage}%</span>
            </div>
            {currentRoute.estimate?.toAmountMin && (
              <div className="detail-row">
                <span>Minimum Received</span>
                <span>
                  {formatNumber(lifi.fromWei(currentRoute.estimate.toAmountMin, toToken.decimals), 4)} {toToken.symbol}
                </span>
              </div>
            )}
            <div className="detail-row highlight">
              <span>Estimated Gas</span>
              <span className="gas-cost">{getGasCostUSD()}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="swap-error">
            ⚠️ {error}
          </div>
        )}

        {/* Transaction Success */}
        {txHash && !isSwapping && (
          <div className="swap-success">
            <p>✅ Swap initiated successfully!</p>
            <a 
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View Transaction
            </a>
            {/* Cross-chain status */}
            {isCrossChain && transferStatus && (
              <p className="transfer-status">{transferStatus}</p>
            )}
          </div>
        )}

        {/* Approval/Swap Buttons */}
        {needsApproval ? (
          <button
            className="swap-button"
            onClick={handleApproval}
            disabled={!currentRoute || isApproving || !fromAmount || parseFloat(fromAmount) <= 0}
          >
            {isApproving ? '⏳ Approving...' : `🔐 Approve ${fromToken.symbol}`}
          </button>
        ) : (
          <button
            className="swap-button"
            onClick={handleSwap}
            disabled={!currentRoute || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
          >
            {isSwapping ? '⏳ Swapping...' : `🔄 Swap ${fromToken.symbol} for ${toToken.symbol}`}
          </button>
        )}

        {/* Info */}
        <div className="swap-info">
          <p>🌉 <strong>Cross-Chain Swaps:</strong> Swap between Ethereum, Base, Solana, Arbitrum, Optimism & Polygon.</p>
          <p>🔒 <strong>Best Rates:</strong> LiFi aggregates prices from multiple DEXes and bridges.</p>
          {needsApproval && (
            <p>🔐 <strong>Approval Required:</strong> You need to approve the contract to spend your tokens (one-time per token).</p>
          )}
          <p>⚠️ <strong>Gas Fees:</strong> You pay network gas fees for transactions. Make sure you have enough native tokens (ETH, MATIC, etc.).</p>
        </div>
      </div>
    </div>
  );
}
