/**
 * Transaction Explorer with Analytics
 * Displays transaction history with persistent localStorage caching
 */

import { useState, useEffect } from 'react';
import { useSbcApp } from '@stablecoin.xyz/react';
import * as etherscan from '../services/etherscan';

const PLATFORM_WALLET = '0x97fd851453E04e70D290E922e6A72D34a28AC331';
const DEFAULT_USER_WALLET = '0x3B2aD8a535e606F83CF24c9e7f3dE9881EDC7cE1';

export default function TransactionExplorer() {
  const { ownerAddress } = useSbcApp();
  
  const [platformTxs, setPlatformTxs] = useState<etherscan.Transaction[]>([]);
  const [userTxs, setUserTxs] = useState<etherscan.Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'agent_payment' | 'dex_swap' | 'transfer'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Current user wallet (from MetaMask or default)
  const currentWallet = ownerAddress || DEFAULT_USER_WALLET;

  // Fetch transactions on mount and periodically
  useEffect(() => {
    // Initial fetch
    fetchTransactions();
    
    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered');
        fetchTransactions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentWallet, autoRefresh]);

  const fetchTransactions = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) {
        console.log('🔄 Force refreshing transactions...');
      } else {
        console.log('🔍 Fetching transactions for explorer...');
      }
      
      // Fetch platform wallet transactions (agent payments received)
      const platformData = await etherscan.getCachedTransactions(
        PLATFORM_WALLET,
        etherscan.STORAGE_KEYS.PLATFORM_TXS,
        forceRefresh
      );
      setPlatformTxs(platformData || []);

      // Fetch current user wallet transactions (swaps, transfers made)
      const userCacheKey = `${etherscan.STORAGE_KEYS.USER_TXS_PREFIX}${currentWallet.toLowerCase()}`;
      const userData = await etherscan.getCachedTransactions(
        currentWallet,
        userCacheKey,
        forceRefresh
      );
      setUserTxs(userData || []);

      console.log('✅ Transactions loaded:', {
        platform: platformData?.length || 0,
        user: userData?.length || 0,
        total: (platformData?.length || 0) + (userData?.length || 0)
      });
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      // Set empty arrays on error
      setPlatformTxs([]);
      setUserTxs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine and filter transactions
  const allTxs = [...platformTxs, ...userTxs]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(tx => {
      if (filter === 'all') return true;
      return tx.category === filter;
    });

  // Remove duplicates (same hash)
  const uniqueTxs = Array.from(
    new Map(allTxs.map(tx => [tx.hash, tx])).values()
  );

  // Calculate statistics
  const stats = etherscan.calculateStats(uniqueTxs);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'agent_payment':
        return <span className="tx-badge tx-badge-agent">🤖 Agent Payment</span>;
      case 'dex_swap':
        return <span className="tx-badge tx-badge-swap">🔄 DEX Swap</span>;
      case 'transfer':
        return <span className="tx-badge tx-badge-transfer">💸 Transfer</span>;
      default:
        return <span className="tx-badge tx-badge-other">📝 Other</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? '✅' : '❌';
  };

  return (
    <div className="explorer-page">
      <div className="explorer-header">
        <div>
          <h2>⭐ Transaction Explorer & Analytics</h2>
          <p className="explorer-subtitle">
            Track all agent payments and DEX swaps on Base network with persistent history
          </p>
        </div>
        <button
          className="explorer-refresh-btn"
          onClick={() => fetchTransactions(true)}
          disabled={isLoading}
          title="Force refresh from blockchain"
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh Now'}
        </button>
      </div>

      {/* Wallet Info Cards */}
      <div className="explorer-wallets">
        <div className="explorer-wallet-card">
          <div className="wallet-card-header">
            <span className="wallet-icon">🏦</span>
            <span className="wallet-label">Platform Wallet</span>
          </div>
          <div className="wallet-address">{formatAddress(PLATFORM_WALLET)}</div>
          <a
            href={`https://basescan.org/address/${PLATFORM_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-link"
          >
            View on BaseScan ↗
          </a>
        </div>
        <div className="explorer-wallet-card">
          <div className="wallet-card-header">
            <span className="wallet-icon">👤</span>
            <span className="wallet-label">Your Wallet</span>
          </div>
          <div className="wallet-address">{formatAddress(currentWallet)}</div>
          <a
            href={`https://basescan.org/address/${currentWallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-link"
          >
            View on BaseScan ↗
          </a>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="explorer-stats">
        <div className="explorer-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.totalTransactions}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="explorer-stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-value">{stats.agentPayments}</div>
          <div className="stat-label">Agent Payments</div>
        </div>
        <div className="explorer-stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{stats.dexSwaps}</div>
          <div className="stat-label">DEX Swaps</div>
        </div>
        <div className="explorer-stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-value">{stats.transfers}</div>
          <div className="stat-label">Transfers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="explorer-filters">
        <button
          className={`explorer-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Transactions
        </button>
        <button
          className={`explorer-filter-btn ${filter === 'agent_payment' ? 'active' : ''}`}
          onClick={() => setFilter('agent_payment')}
        >
          🤖 Agent Payments
        </button>
        <button
          className={`explorer-filter-btn ${filter === 'dex_swap' ? 'active' : ''}`}
          onClick={() => setFilter('dex_swap')}
        >
          🔄 DEX Swaps
        </button>
        <button
          className={`explorer-filter-btn ${filter === 'transfer' ? 'active' : ''}`}
          onClick={() => setFilter('transfer')}
        >
          💸 Transfers
        </button>
        <label className="explorer-auto-refresh">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>Auto-refresh (30s)</span>
        </label>
      </div>

      {/* Transaction List */}
      <div className="explorer-transactions">
        {isLoading && uniqueTxs.length === 0 ? (
          <div className="explorer-loading">
            <div className="explorer-spinner"></div>
            <p>Loading transactions from blockchain...</p>
            <p className="explorer-hint">This may take a few seconds on first load</p>
          </div>
        ) : uniqueTxs.length === 0 ? (
          <div className="explorer-empty">
            <div className="empty-icon">📭</div>
            <p>No transactions found</p>
            <p className="explorer-hint">Make a swap or agent payment to see transactions here!</p>
          </div>
        ) : (
          <div className="explorer-table">
            <div className="explorer-table-header">
              <div className="col-hash">Transaction</div>
              <div className="col-type">Type</div>
              <div className="col-from">From</div>
              <div className="col-to">To</div>
              <div className="col-value">Value</div>
              <div className="col-time">Time</div>
              <div className="col-status">Status</div>
            </div>
            {uniqueTxs.map((tx) => (
              <div key={tx.hash} className="explorer-table-row">
                <div className="col-hash">
                  <a
                    href={`https://basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-hash"
                  >
                    {formatAddress(tx.hash)}
                  </a>
                </div>
                <div className="col-type">{getCategoryBadge(tx.category)}</div>
                <div className="col-from">
                  <span className={tx.from.toLowerCase() === currentWallet.toLowerCase() ? 'address-highlight' : ''}>
                    {formatAddress(tx.from)}
                  </span>
                </div>
                <div className="col-to">
                  <span className={tx.to.toLowerCase() === PLATFORM_WALLET.toLowerCase() ? 'address-highlight' : ''}>
                    {formatAddress(tx.to)}
                  </span>
                </div>
                <div className="col-value">{etherscan.formatTxValue(tx)}</div>
                <div className="col-time">{formatDate(tx.timestamp)}</div>
                <div className="col-status">{getStatusIcon(tx.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="explorer-footer">
        <p>
          💡 <strong>Persistent History:</strong> Transaction data is cached locally and survives page refreshes. Your history is never lost!
        </p>
        <p>
          🔍 <strong>Multi-Wallet:</strong> Automatically tracks platform wallet (agent payments) and your wallet (swaps & transfers).
        </p>
        <p>
          ⚡ <strong>Smart Caching:</strong> Data refreshes every 5 minutes or when you click refresh. Instant load from cache.
        </p>
      </div>
    </div>
  );
}

