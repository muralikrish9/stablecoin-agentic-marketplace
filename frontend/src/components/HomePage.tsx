/**
 * Home Page / Landing Page for Stablecoin Agentic Marketplace
 */

interface HomePageProps {
  onEnterMarketplace: () => void;
}

export default function HomePage({ onEnterMarketplace }: HomePageProps) {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Stablecoin Agentic</span>
            <br />
            <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="hero-subtitle">
            The Future of Decentralized AI & Crypto Tools
          </p>
          <p className="hero-description">
            Unlock the power of autonomous AI agents, cross-chain swaps, and real-time blockchain analytics.
            All powered by stablecoin micropayments on Base Network.
          </p>
          <button className="cta-button" onClick={onEnterMarketplace}>
            🚀 Enter Marketplace
          </button>
        </div>
        <div className="hero-graphic">
          <div className="floating-card card-1">
            <div className="card-icon">🤖</div>
            <div className="card-label">AI Agents</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">🔄</div>
            <div className="card-label">DEX Swaps</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">⭐</div>
            <div className="card-label">Analytics</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Why Choose Our Marketplace?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Instant execution powered by Base network with near-zero latency and gasless transactions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Trustless</h3>
            <p>Non-custodial wallet integration. You remain in full control of your assets at all times</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌉</div>
            <h3>Cross-Chain Ready</h3>
            <p>Seamlessly swap assets across Ethereum, Base, Solana, Arbitrum, Optimism & Polygon</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>Stablecoin Payments</h3>
            <p>Pay with SBC stablecoins - no volatility, predictable costs, automatic micropayments</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Agents</h3>
            <p>Advanced multi-agent swarms that collaborate to solve complex development tasks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-Time Analytics</h3>
            <p>Track all transactions with persistent history and comprehensive blockchain analytics</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Connect Wallet</h3>
              <p>Link your Web3 wallet to access the marketplace securely</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Browse Tools</h3>
              <p>Explore AI agents, DEX tools, and analytics services</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Execute Tasks</h3>
              <p>Use tools and pay automatically with SBC tokens</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track Results</h3>
              <p>Monitor transactions and results in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-value">5+</div>
          <div className="stat-label">AI Agents</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">6</div>
          <div className="stat-label">Supported Chains</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">$0</div>
          <div className="stat-label">Gas Fees</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Availability</div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join the future of decentralized AI and crypto tools</p>
        <button className="cta-button-large" onClick={onEnterMarketplace}>
          🚀 Explore Marketplace
        </button>
      </div>
    </div>
  );
}

