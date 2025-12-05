/**
 * Etherscan V2 API Integration for Base Network
 * Fetches and caches transaction data with localStorage persistence
 */

const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api';
const BASE_CHAIN_ID = 8453;
const API_KEY = 'I48MYHDDYIEE2XFV3HQDW35GU6HK4AMW7J';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUSD?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  timestamp: number;
  blockNumber: string;
  type: 'native' | 'token';
  category?: 'agent_payment' | 'dex_swap' | 'transfer' | 'other';
  status: 'success' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  agentPayments: number;
  dexSwaps: number;
  transfers: number;
  totalValueUSD: number;
  lastUpdated: number;
}

/**
 * Fetch normal ETH transactions for an address
 */
export async function fetchNormalTransactions(address: string): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams({
      chainid: BASE_CHAIN_ID.toString(),
      module: 'account',
      action: 'txlist',
      address: address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '100',
      sort: 'desc',
      apikey: API_KEY,
    });

    const url = `${ETHERSCAN_V2_API}?${params}`;
    console.log('📡 Fetching normal TXs:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📥 Normal TXs response:', {
      status: data.status,
      message: data.message,
      resultCount: data.result?.length || 0,
    });

    if (data.status === '1' && data.result && Array.isArray(data.result)) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        blockNumber: tx.blockNumber,
        type: 'native' as const,
        status: tx.isError === '0' ? 'success' : 'failed',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching normal transactions:', error);
    return [];
  }
}

/**
 * Fetch ERC-20 token transfers for an address
 */
export async function fetchTokenTransactions(address: string): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams({
      chainid: BASE_CHAIN_ID.toString(),
      module: 'account',
      action: 'tokentx',
      address: address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '100',
      sort: 'desc',
      apikey: API_KEY,
    });

    const url = `${ETHERSCAN_V2_API}?${params}`;
    console.log('📡 Fetching token TXs:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📥 Token TXs response:', {
      status: data.status,
      message: data.message,
      resultCount: data.result?.length || 0,
    });

    if (data.status === '1' && data.result && Array.isArray(data.result)) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        tokenDecimal: tx.tokenDecimal,
        timestamp: parseInt(tx.timeStamp) * 1000,
        blockNumber: tx.blockNumber,
        type: 'token' as const,
        status: 'success',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return [];
  }
}

/**
 * Fetch all transactions for an address (normal + token)
 */
export async function fetchAllTransactions(address: string): Promise<Transaction[]> {
  console.log(`🔍 Fetching transactions for ${address.slice(0, 6)}...${address.slice(-4)}`);
  
  const [normalTxs, tokenTxs] = await Promise.all([
    fetchNormalTransactions(address),
    fetchTokenTransactions(address),
  ]);

  // Combine and sort by timestamp (newest first)
  const allTxs = [...normalTxs, ...tokenTxs].sort((a, b) => b.timestamp - a.timestamp);

  // Categorize transactions
  const categorized = allTxs.map(tx => ({
    ...tx,
    category: categorizeTx(tx),
  }));

  console.log(`✅ Fetched ${categorized.length} transactions`);
  return categorized;
}

/**
 * Categorize transaction based on addresses and context
 */
function categorizeTx(tx: Transaction): Transaction['category'] {
  const PLATFORM_WALLET = '0x97fd851453e04e70d290e922e6a72d34a28ac331';
  const LIFI_CONTRACT = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
  
  // Agent payment (to platform wallet with SBC)
  if (tx.to.toLowerCase() === PLATFORM_WALLET.toLowerCase() && tx.tokenSymbol === 'SBC') {
    return 'agent_payment';
  }
  
  // DEX swap (via LiFi)
  if (tx.to.toLowerCase() === LIFI_CONTRACT.toLowerCase()) {
    return 'dex_swap';
  }
  
  // Regular transfer
  if (tx.tokenSymbol || tx.value !== '0') {
    return 'transfer';
  }
  
  return 'other';
}

/**
 * Format transaction value for display
 */
export function formatTxValue(tx: Transaction): string {
  const value = BigInt(tx.value);
  
  if (tx.type === 'token') {
    const decimals = parseInt(tx.tokenDecimal || '18');
    const divisor = BigInt(10 ** decimals);
    const amount = Number(value) / Number(divisor);
    return `${amount.toFixed(6)} ${tx.tokenSymbol || 'TOKEN'}`;
  } else {
    const ethAmount = Number(value) / 1e18;
    return `${ethAmount.toFixed(6)} ETH`;
  }
}

/**
 * LocalStorage keys
 */
const STORAGE_KEYS = {
  PLATFORM_TXS: 'sbc_explorer_platform_txs',
  USER_TXS_PREFIX: 'sbc_explorer_user_txs_',
  TIMESTAMP_PREFIX: 'sbc_explorer_timestamp_',
};

/**
 * Save transactions to localStorage
 */
export function saveTransactions(key: string, transactions: Transaction[]) {
  try {
    localStorage.setItem(key, JSON.stringify(transactions));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    console.log(`💾 Saved ${transactions.length} transactions to cache`);
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
  }
}

/**
 * Load transactions from localStorage
 */
export function loadTransactions(key: string): Transaction[] | null {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const txs = JSON.parse(data);
      console.log(`📦 Loaded ${txs.length} transactions from cache`);
      return txs;
    }
    return null;
  } catch (error) {
    console.error('Error loading transactions from localStorage:', error);
    return null;
  }
}

/**
 * Check if cached data is stale (older than 1 minute by default for faster updates)
 */
export function isCacheStale(key: string, maxAgeMinutes: number = 1): boolean {
  const timestamp = localStorage.getItem(`${key}_timestamp`);
  if (!timestamp) return true;
  
  const age = Date.now() - parseInt(timestamp);
  const isStale = age > maxAgeMinutes * 60 * 1000;
  
  if (isStale) {
    console.log(`⏰ Cache expired for ${key.slice(-10)}... (age: ${Math.floor(age/1000)}s)`);
  }
  
  return isStale;
}

/**
 * Get transactions with caching
 */
export async function getCachedTransactions(
  address: string,
  cacheKey: string,
  forceRefresh: boolean = false
): Promise<Transaction[]> {
  // Force refresh bypasses cache
  if (forceRefresh) {
    console.log(`🔄 Force refresh - fetching fresh transactions for ${address.slice(0, 6)}...`);
    const transactions = await fetchAllTransactions(address);
    saveTransactions(cacheKey, transactions);
    return transactions;
  }
  
  // Try to load from cache first
  const cached = loadTransactions(cacheKey);
  const isStale = isCacheStale(cacheKey);
  
  // If we have fresh cache with data, return it
  // Important: Check if cached has transactions (length > 0) or if it's null
  if (cached && cached.length > 0 && !isStale) {
    console.log(`⚡ Using cached transactions for ${address.slice(0, 6)}... (${cached.length} txs)`);
    return cached;
  }
  
  // Fetch fresh data if cache is empty, stale, or doesn't exist
  console.log(`🔄 Fetching fresh transactions for ${address.slice(0, 6)}... (cache ${cached ? 'empty' : 'missing'} or stale)`);
  const transactions = await fetchAllTransactions(address);
  
  // Save to cache
  saveTransactions(cacheKey, transactions);
  
  return transactions;
}

/**
 * Clear cached transactions
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  } else {
    // Clear all transaction caches
    Object.values(STORAGE_KEYS).forEach(key => {
      if (typeof key === 'string') {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      }
    });
    console.log('🗑️ Cleared all transaction caches');
  }
}

/**
 * Calculate transaction statistics
 */
export function calculateStats(transactions: Transaction[]): TransactionStats {
  const stats: TransactionStats = {
    totalTransactions: transactions.length,
    agentPayments: 0,
    dexSwaps: 0,
    transfers: 0,
    totalValueUSD: 0,
    lastUpdated: Date.now(),
  };

  transactions.forEach(tx => {
    switch (tx.category) {
      case 'agent_payment':
        stats.agentPayments++;
        break;
      case 'dex_swap':
        stats.dexSwaps++;
        break;
      case 'transfer':
        stats.transfers++;
        break;
    }
  });

  return stats;
}

export { STORAGE_KEYS };

