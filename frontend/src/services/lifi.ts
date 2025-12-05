/**
 * LiFi API integration for cross-chain swaps
 * Documentation: https://docs.li.fi/
 */

const LIFI_API_BASE = 'https://li.quest/v1';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY || '62e930ab-3b61-4f3d-9086-9b5c3628c684.b1d0eae6-d269-44ca-b367-11fea8655438';

export interface Token {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  priceUSD?: string;
}

export interface Route {
  id: string;
  fromAmount: string;
  toAmount: string;
  fromToken: Token;
  toToken: Token;
  tool?: string; // Bridge/DEX tool used (e.g., 'stargate', 'uniswap')
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    gasCosts: Array<{
      amount: string;
      amountUSD: string;
    }>;
    executionDuration: number;
  };
  steps: Array<{
    action: {
      fromToken: Token;
      toToken: Token;
      fromAmount: string;
      toAmount: string;
    };
    tool: string;
    toolDetails: {
      name: string;
      logoURI: string;
    };
  }>;
  transactionRequest?: {
    to: string;
    data: string;
    value: string;
    from: string;
    chainId: number;
    gasLimit: string;
  };
}

export interface QuoteRequest {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage?: number; // 0.005 = 0.5%
}

/**
 * Get available tokens on a chain
 */
export async function getTokens(chainId: number = 8453): Promise<Token[]> {
  try {
    const response = await fetch(`${LIFI_API_BASE}/tokens?chains=${chainId}`);
    if (!response.ok) throw new Error('Failed to fetch tokens');
    const data = await response.json();
    return data.tokens[chainId] || [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
}

/**
 * Get a quote for a swap (LiFi official API)
 */
export async function getQuote(request: QuoteRequest): Promise<Route | null> {
  try {
    const params = new URLSearchParams({
      fromChain: request.fromChain.toString(),
      toChain: request.toChain.toString(),
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.fromAmount,
      fromAddress: request.fromAddress,
    });

    // Add optional slippage if provided
    if (request.slippage) {
      params.append('slippage', request.slippage.toString());
    }

    console.log('🔍 Requesting LiFi quote:', params.toString());

    const response = await fetch(`${LIFI_API_BASE}/quote?${params}`, {
      method: 'GET',
      headers: {
        'x-lifi-api-key': LIFI_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ LiFi quote error:', error);
      return null;
    }

    const quote = await response.json();
    console.log('✅ LiFi quote received:', quote);
    return quote;
  } catch (error) {
    console.error('❌ Error getting quote:', error);
    return null;
  }
}

/**
 * Get the transaction data to execute a swap
 */
export async function getSwapTransaction(route: Route): Promise<Route | null> {
  try {
    // LiFi quote already includes transaction request
    return route;
  } catch (error) {
    console.error('Error building swap transaction:', error);
    return null;
  }
}

/**
 * Status response for cross-chain transfers
 */
export interface StatusResponse {
  status: 'PENDING' | 'DONE' | 'FAILED' | 'NOT_FOUND' | 'INVALID';
  substatus?: string;
  substatusMessage?: string;
  sending?: {
    txHash: string;
    amount: string;
    token: Token;
    chainId: number;
  };
  receiving?: {
    txHash?: string;
    amount: string;
    token: Token;
    chainId: number;
  };
}

/**
 * Check status of a cross-chain transfer (only needed when fromChain !== toChain)
 * Following official LiFi docs example
 */
export async function getStatus(
  bridge: string,
  fromChain: number,
  toChain: number,
  txHash: string
): Promise<StatusResponse | null> {
  try {
    const params = new URLSearchParams({
      bridge,
      fromChain: fromChain.toString(),
      toChain: toChain.toString(),
      txHash,
    });

    console.log('🔍 Checking transfer status:', { bridge, fromChain, toChain, txHash });

    const response = await fetch(`${LIFI_API_BASE}/status?${params}`, {
      method: 'GET',
      headers: {
        'x-lifi-api-key': LIFI_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('❌ Status check error:', response.status);
      return null;
    }

    const status = await response.json();
    console.log(`📊 Transfer status: ${status.status}`);
    return status;
  } catch (error) {
    console.error('❌ Error checking status:', error);
    return null;
  }
}

/**
 * Helper: Format amount from decimal to wei
 */
export function toWei(amount: string, decimals: number): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + fraction).toString();
}

/**
 * Helper: Format amount from wei to decimal
 */
export function fromWei(amount: string, decimals: number): string {
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amountBigInt / divisor;
  const remainder = amountBigInt % divisor;
  const fraction = remainder.toString().padStart(decimals, '0');
  
  // Trim trailing zeros
  const trimmed = fraction.replace(/0+$/, '');
  
  if (trimmed === '') {
    return whole.toString();
  }
  return `${whole}.${trimmed}`;
}

/**
 * Cross-chain tokens for swapping
 * Includes Base, Ethereum, Solana, and other popular chains
 */
export const CROSS_CHAIN_TOKENS = {
  // Base Network (8453)
  BASE_ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum (Base)',
    decimals: 18,
    chainId: 8453,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  BASE_SBC: {
    address: '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798',
    symbol: 'SBC',
    name: 'Stablecoin (Base)',
    decimals: 18,
    chainId: 8453,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  BASE_USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin (Base)',
    decimals: 6,
    chainId: 8453,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  
  // Ethereum Mainnet (1)
  ETH_MAINNET: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum (Mainnet)',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  ETH_USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin (Ethereum)',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  ETH_USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether (Ethereum)',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  
  // Solana (1151111081099710)
  SOL: {
    address: 'So11111111111111111111111111111111111111112', // Wrapped SOL (native SOL representation)
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    chainId: 1151111081099710,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  },
  SOL_USDC: {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin (Solana)',
    decimals: 6,
    chainId: 1151111081099710,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  
  // Arbitrum (42161)
  ARB_ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum (Arbitrum)',
    decimals: 18,
    chainId: 42161,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  ARB_USDC: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin (Arbitrum)',
    decimals: 6,
    chainId: 42161,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  
  // Optimism (10)
  OP_ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum (Optimism)',
    decimals: 18,
    chainId: 10,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  OP_USDC: {
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    symbol: 'USDC',
    name: 'USD Coin (Optimism)',
    decimals: 6,
    chainId: 10,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
  
  // Polygon (137)
  POL: {
    address: '0x0000000000000000000000000000000000001010',
    symbol: 'POL',
    name: 'Polygon',
    decimals: 18,
    chainId: 137,
    logoURI: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  },
  POL_USDC: {
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    symbol: 'USDC',
    name: 'USD Coin (Polygon)',
    decimals: 6,
    chainId: 137,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
};

// Legacy token list for Base only
export const POPULAR_TOKENS = {
  ETH: CROSS_CHAIN_TOKENS.BASE_ETH,
  SBC: CROSS_CHAIN_TOKENS.BASE_SBC,
  USDC: CROSS_CHAIN_TOKENS.BASE_USDC,
};

// Full cross-chain token list for dropdown
export const TOKEN_LIST = Object.values(CROSS_CHAIN_TOKENS);

// Chain names for display
export const CHAIN_NAMES: { [key: number]: string } = {
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
  1151111081099710: 'Solana',
};

