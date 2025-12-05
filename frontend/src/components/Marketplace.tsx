/**
 * Marketplace View - Tool Selection Hub
 */

export type MarketplaceTool = 'ai-agents' | 'dex-swap' | 'explorer';

interface MarketplaceProps {
  onSelectTool: (tool: MarketplaceTool) => void;
}

export default function Marketplace({ onSelectTool }: MarketplaceProps) {
  const tools = [
    {
      id: 'ai-agents' as MarketplaceTool,
      icon: '🤖',
      title: 'AI Coding Agents',
      subtitle: 'Multi-Agent Development Swarm',
      description: 'Deploy a team of specialized AI agents to handle your coding tasks. From requirements analysis to quality assurance, our agents collaborate to deliver production-ready code.',
      features: [
        'Requirements Analysis',
        'Context Understanding',
        'Code Generation',
        'Quality Assurance',
        'Automatic Testing'
      ],
      price: 'Pay per task',
      popular: true,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'dex-swap' as MarketplaceTool,
      icon: '🔄',
      title: 'Cross-Chain DEX',
      subtitle: 'Universal Token Swapping',
      description: 'Swap tokens across multiple blockchains with best-price execution. Powered by LiFi, aggregating liquidity from leading DEXes and bridges for optimal rates.',
      features: [
        'Multi-Chain Support',
        'Best Price Routing',
        'Low Slippage',
        'Bridge Integration',
        'Instant Execution'
      ],
      price: 'Standard gas fees',
      popular: false,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'explorer' as MarketplaceTool,
      icon: '⭐',
      title: 'Transaction Explorer',
      subtitle: 'Blockchain Analytics Dashboard',
      description: 'Track all your transactions with comprehensive analytics. Monitor agent payments, DEX swaps, and transfers with persistent history and real-time updates.',
      features: [
        'Real-Time Tracking',
        'Persistent History',
        'Multi-Wallet Support',
        'Category Filters',
        'Analytics Dashboard'
      ],
      price: 'Free to use',
      popular: false,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  ];

  return (
    <div className="marketplace-page">
      {/* Header */}
      <div className="marketplace-header">
        <h1 className="marketplace-title">
          <span className="gradient-text">Explore Tools & Services</span>
        </h1>
        <p className="marketplace-subtitle">
          Select a tool to get started. All powered by stablecoin micropayments on Base Network.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="marketplace-grid">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            className={`marketplace-tool-card ${tool.popular ? 'popular' : ''}`}
            onClick={() => onSelectTool(tool.id)}
          >
            {tool.popular && (
              <div className="popular-badge">⭐ POPULAR</div>
            )}
            
            <div className="tool-card-header" style={{ background: tool.gradient }}>
              <div className="tool-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <p className="tool-subtitle">{tool.subtitle}</p>
            </div>

            <div className="tool-card-body">
              <p className="tool-description">{tool.description}</p>

              <div className="tool-features">
                <h4>Key Features:</h4>
                <ul>
                  {tool.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tool-card-footer">
                <div className="tool-price">
                  <span className="price-icon">💰</span>
                  <span>{tool.price}</span>
                </div>
                <button className="use-tool-button">
                  Use Tool →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="marketplace-info">
        <div className="info-card">
          <div className="info-icon">🔒</div>
          <div className="info-content">
            <h4>Secure & Non-Custodial</h4>
            <p>Your wallet, your keys. We never have access to your funds.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">⚡</div>
          <div className="info-content">
            <h4>Gasless Transactions</h4>
            <p>Pay only for services. Most transactions are gasless via SBC SDK.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">🌐</div>
          <div className="info-content">
            <h4>Multi-Chain Support</h4>
            <p>Access tools across Ethereum, Base, Solana, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

