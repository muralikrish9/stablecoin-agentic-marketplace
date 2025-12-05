# 🏪 Stablecoin Agentic Marketplace
 
**AI-Powered Development Tools with Gasless SBC Micropayments on Base**
 
Built for **Hack Midwest 2025** | [Demo Video](#) | [Architecture Docs](./COMPLETE_ARCHITECTURE_OVERVIEW.md)
<img width="800" height="600" alt="svgviewer-png-output (1)" src="https://github.com/user-attachments/assets/298ac45a-3426-48c9-8257-6b5d88475a75" />

---
## For quick demo on project flow please refer below URL
https://www.youtube.com/watch?v=op_7X8sIdsE 
[![Video Thumbnail](https://img.youtube.com/vi/op_7X8sIdsE/0.jpg)](https://www.youtube.com/watch?v=op_7X8sIdsE "Video Title")

## 🎯 What It Does
 
A decentralized marketplace combining **multi-agent AI** with **gasless blockchain payments**, featuring:
 
1. **🤖 AI Coding Agents** - 5 Strands agents collaborate to complete coding tasks with automatic quality-based micropayments
2. **🔄 Cross-Chain DEX** - Swap tokens across 6 blockchains (Base, Ethereum, Solana, Arbitrum, Optimism, Polygon) via LiFi
3. **⭐ Transaction Explorer** - Real-time blockchain analytics with smart categorization and persistent caching
 
**Key Innovation:** First platform to combine Strands multi-agent swarm intelligence with SBC gasless payment infrastructure and integrated cross-chain DEX.
 
---
 
## ✨ Features
 
### 🤖 AI Coding Agents (Strands Multi-Agent Swarm)
 
- **5 Specialized Agents Working Together:**
  - 📋 **Requirements Agent** - Analyzes and structures requirements, assesses complexity
  - 🔍 **Context Agent** - Understands codebase patterns and architecture
  - 🔨 **Builder Agent** - Writes production-quality code with tests
  - ✅ **Quality Agent** - Verifies implementation and assigns quality score (0-100)
  - 🎯 **Escalation Agent** - Makes final COMPLETE/ESCALATE decision
 
- **Dynamic Micropayments:**
  - Base pricing: Simple ($0.03) | Medium ($0.08) | Complex ($0.20)
  - Quality multipliers: Excellent (×1.3) | Good (×1.15) | Acceptable (×1.0)
  - Speed bonuses: Very Fast (×1.1) | Fast (×1.05) | Normal (×1.0)
  - Token cost: $0.0001 per 1K tokens
  - **Example:** Simple task with 90/100 quality = $0.03 × 1.15 × 1.05 = **$0.036**
 
- **Gasless Payments:**
  - EIP-2612 permit signatures (one-click approval)
  - SBC paymaster covers ALL gas fees
  - Atomic transactions (permit + transfer)
  - User pays **ZERO gas**
 
### 🔄 Cross-Chain DEX (LiFi Integration)
 
- **Multi-Chain Support:**
  - Base (8453), Ethereum (1), Solana, Arbitrum (42161), Optimism (10), Polygon (137)
  - 15+ DEX aggregation (Uniswap, Curve, 1inch, Stargate, etc.)
 
- **Features:**
  - Real-time quotes with best rates
  - Cross-chain bridging
  - Slippage protection (0.5% default)
  - Gas estimates in USD
  - Token approval management
 
### ⭐ Transaction Explorer (Custom SBC Explorer)
 
- **Smart Features:**
  - Persistent localStorage caching (1-minute freshness)
  - Multi-wallet support with auto-detection
  - Smart categorization: Agent Payments | DEX Swaps | Transfers | Other
  - Real-time analytics dashboard
  - Auto-refresh every 30 seconds
  - Etherscan V2 API integration
 
- **Dual Tracking:**
  - Platform wallet (receives agent payments)
  - User wallet (your transactions)
 
---
 
## 🛠️ Tech Stack

### Frontend
- React 19.1.0
- TypeScript 5.0
- Vite 5.0
- @stablecoin.xyz/react 0.5.1
- viem 2.38.0

### Backend
- Python 3.12+
- strands-agents
- boto3 1.40+
- python-dotenv 1.1.1

### Blockchain & APIs
- Base Mainnet (Chain ID: 8453)
- SBC Token: 0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798
- AWS Bedrock (Claude Sonnet 4)
- LiFi API v1
- Etherscan V2 API
 
---
 
## 🚀 Quick Start
 
### Prerequisites
- Python 3.12+
- Node.js 18+
- MetaMask wallet
- AWS credentials (for Bedrock) OR use mock mode
- SBC tokens on Base (get from [Telegram](https://t.me/+cKrTnXrus_43NWMx))
 
### 1️⃣ Backend Setup
 
```bash
# Navigate to backend directory
cd my-app/Backend
 
# Create virtual environment
python -m venv venv
 
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
 
# Install dependencies
pip install -r requirements.txt
 
# Configure AWS credentials (optional, for real agents)
# ~/.aws/credentials
[default]
aws_access_key_id = YOUR_KEY
aws_secret_access_key = YOUR_SECRET
region = us-east-1
 
# Start backend server
python simple_api_server.py
 
# Server running on http://localhost:8000
```
 
### 2️⃣ Frontend Setup
 
```bash
# Navigate to frontend directory
cd frontend
 
# Install dependencies
npm install
 
# Create environment file
# Copy and edit .env:
VITE_API_URL=http://localhost:8000
VITE_SBC_API_KEY=sbc-73d2b0b2ffa7117d6fdd4c5282a95f7c
VITE_PAYMENT_RECIPIENT=0xYourWalletAddressHere
VITE_RPC_URL=https://base-rpc.publicnode.com
 
# Start development server
npm run dev
 
# Frontend running on http://localhost:5173
```
 
### 3️⃣ Quick Start Script (Optional)
 
**Windows:**
```bash
start.bat
```
 
**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```
 
---
 
## 🎮 How to Use
 
### AI Coding Agents
 
1. Open http://localhost:5173
2. Click **"Connect Wallet"** → Approve MetaMask
3. Navigate: **Home → Enter Marketplace → AI Coding Agents**
4. Enter task: `"Create a binary search algorithm in Python"`
5. Click **"Submit Task"**
6. Watch 5 agents work in real-time (30-50 seconds)
7. View generated code + payment breakdown
8. **Payment sent automatically** (gasless!) after 2 seconds
9. Sign permit in MetaMask (no gas required)
10. ✅ Done! View TX on BaseScan
 
### Cross-Chain Token Swap
 
1. Click **"🔄 Token Swap"** tab
2. Select tokens: `From: 100 SBC (Base)` → `To: USDC (Solana)`
3. Enter amount: `100`
4. Wait for quote (1-2 seconds)
5. Review: Route, gas cost, minimum received
6. Click **"🔐 Approve SBC"** (one-time, ~$0.50 gas)
7. Click **"🔄 Swap"**
8. Approve in MetaMask (you pay gas)
9. Wait for cross-chain bridge (1-5 minutes)
10. ✅ Tokens received on destination chain
 
### Transaction Explorer
 
1. Click **"⭐ Explorer"** tab
2. View all your transactions (instant from cache)
3. Filter by category: All | Agent Payments | DEX Swaps | Transfers
4. Click TX hash → Opens BaseScan
5. Auto-refreshes every 30 seconds
6. Switch wallets in MetaMask → Auto-updates
 
---
 
## 💰 Payment Calculation Examples
 
### Example 1: Simple Task
```
Task: "Create a factorial function"
Complexity: simple
Quality: 90/100 (good)
Time: 45s (fast)
Tokens: 500
 
Calculation:
$0.03 × 1.15 × 1.05 + $0.00005 = $0.036
 
Payment: 0.036 SBC (gasless)
```
 
### Example 2: Medium Task
```
Task: "REST API endpoint with JWT auth"
Complexity: medium  
Quality: 95/100 (excellent)
Time: 80s (normal)
Tokens: 1200
 
Calculation:
$0.08 × 1.3 × 1.0 + $0.00012 = $0.104
 
Payment: 0.104 SBC (gasless)
```
 
---
 
## 🌐 API Endpoints
 
### Backend API (http://localhost:8000)
 
```
GET  /                   # Service info
GET  /api/health         # Health check & swarm status
GET  /api/agents         # List 5 agents with details
POST /api/process        # Process coding task
     Body: { task, github_url?, requirements? }
GET  /api/history        # Last 10 tasks
POST /api/clear          # Clear history
```
 
---
 
## 📁 Project Structure
 
```
my-app/
├── Backend/                        # Python backend
│   ├── agents/
│   │   ├── swarm_orchestrator.py  # Multi-agent coordination (503 lines)
│   │   ├── payment_calculator.py  # Dynamic pricing (180 lines)
│   │   ├── base_agent.py          # Agent configuration
│   │   └── tools/                 # Agent tools
│   │       ├── code_tools.py
│   │       ├── complexity_tools.py
│   │       ├── github_tools.py
│   │       ├── strands_tools.py
│   │       └── test_tools.py
│   ├── main.py                    # CLI interface
│   ├── simple_api_server.py       # HTTP server (206 lines)
│   └── requirements.txt
│
├── src/                            # React frontend
│   ├── components/
│   │   ├── HomePage.tsx           # Landing page
│   │   ├── Marketplace.tsx        # Tool selection
│   │   ├── TaskSubmit.tsx         # AI task form
│   │   ├── AgentActivity.tsx      # Real-time agent status
│   │   ├── ResultDisplay.tsx      # Code results + payment
│   │   ├── SwapInterface.tsx      # DEX UI
│   │   ├── TokenSelector.tsx      # Token picker
│   │   ├── TransactionExplorer.tsx # TX history
│   │   └── StatusBar.tsx          # Health indicator
│   ├── services/
│   │   ├── api.ts                 # Backend client
│   │   ├── lifi.ts                # LiFi DEX integration (380 lines)
│   │   └── etherscan.ts           # Blockchain data (355 lines)
│   ├── App.tsx                    # Main app (635+ lines)
│   ├── App.css                    # Styles (1500+ lines)
│   └── main.tsx
│
├── Documentation/
│   ├── COMPLETE_ARCHITECTURE_OVERVIEW.md  # Full system docs (1847 lines)
│   ├── 3_MINUTE_DEMO_SCRIPT.md            # Demo script
│   ├── DEX_GUIDE.md
│   ├── CROSS_CHAIN_SWAP_GUIDE.md
│   └── TRANSACTION_EXPLORER_GUIDE.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── start.sh
└── start.bat
```
 
---
 
## 🔐 Security & Best Practices
 
### Private Keys & Credentials
- ✅ Never commit `.env` files
- ✅ Store AWS credentials in `~/.aws/credentials`
- ✅ Use environment variables for all secrets
- ✅ Set valid `VITE_PAYMENT_RECIPIENT` address
 
### Smart Contract Security
- ✅ EIP-2612 permit signatures (industry standard)
- ✅ Deadline enforcement (30 minutes max)
- ✅ Nonce management prevents replay attacks
- ✅ Atomic transactions (all-or-nothing)
 
### Payment Security
- ✅ Backend validates all payment amounts
- ✅ Frontend validates input ranges
- ✅ Quality score must be ≥70 for COMPLETE
- ✅ Slippage protection on DEX swaps
 
---
 
## 🏆 Challenge Requirements
 
### ✅ Strands Agents SDK Challenge
 
**Integration:**
- 5 specialized agents using Strands SDK
- Multi-agent swarm coordination with handoffs
- AWS Bedrock Claude Sonnet 4 integration
- Real-time agent status tracking
 
**Innovation:**
- First platform to use Strands agents for automatic payment calculation
- Quality-based pricing (score 0-100 determines multiplier)
- Complexity detection (simple/medium/complex)
- Automatic COMPLETE/ESCALATE decisions
 
**Real-World Use:**
- Production-ready code generation
- Comprehensive testing and quality checks
- GitHub repository integration
- Fully functional on live API
 
### ✅ Brale Stablecoin Challenge
 
**SBC Integration:**
- Gasless transactions via EIP-2612 permits + paymaster
- Automatic micropayments calculated dynamically
- Live on Base Mainnet (Chain ID 8453)
- Real SBC token: `0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798`
 
**Novel Features:**
- Custom SBC transaction explorer with smart categorization
- Cross-chain swaps to acquire SBC (LiFi integration)
- Account abstraction for seamless UX
- Transparent payment breakdown
 
**Usability:**
- Zero gas fees for users
- Instant payment execution (2-3 seconds)
- Multi-wallet support
- Real-time analytics
 
---
 
## 📊 Performance Metrics
 
- **Agent Processing:** 30-50s (simple), 60-90s (medium), 90-120s (complex)
- **Payment Confirmation:** 2-3 seconds on Base
- **Transaction Explorer:** <100ms cached, 2-5s fresh load
- **DEX Quotes:** 1-2 seconds via LiFi
- **Bundle Size:** ~450 KB (gzipped)
 
---
 
## 🐛 Troubleshooting
 
### Backend Issues
 
**"Swarm not available" or mock mode:**
```bash
# Install AWS CLI and configure credentials
pip install awscli
aws configure
# Enter your AWS access key, secret key, region (us-east-1)
 
# Verify Bedrock access
python -c "import boto3; print(boto3.client('bedrock-runtime', region_name='us-east-1').list_foundation_models())"
```
 
**Port 8000 already in use:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
 
# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```
 
### Frontend Issues
 
**"Connect Wallet" not working:**
- Install MetaMask extension
- Switch to Base Mainnet (Chain ID: 8453)
- Add Base network manually if needed
 
**Payment not sent:**
- Check `VITE_PAYMENT_RECIPIENT` is set in `.env`
- Ensure you have SBC tokens in wallet
- Verify wallet is connected to Base Mainnet
 
**DEX swap fails:**
- Approve token first (one-time transaction)
- Ensure sufficient balance + gas for approval/swap
- Check you're on the source chain (Base for SBC)
 
**Explorer not loading:**
- Clear localStorage: `localStorage.clear()` in browser console
- Check internet connection (needs Etherscan API)
- Verify wallet address is valid
 
---
 
## 📝 Example Tasks to Try
 
### Simple Tasks ($0.03-0.05)
- "Create a factorial function"
- "Write a binary search algorithm"
- "Implement a todo list class"
- "Create a function to validate email addresses"
 
### Medium Tasks ($0.08-0.12)
- "Create a REST API endpoint for user login"
- "Write a React component for a modal dialog"
- "Implement JWT authentication middleware"
- "Build a rate limiter for API requests"
 
### Complex Tasks ($0.20+, may escalate)
- "Design a microservice architecture for payments"
- "Build a real-time chat system with WebSocket"
- "Create a CI/CD pipeline configuration"
- "Implement a distributed caching layer"
 
---
 
## 🤝 Contributing
 
This project was built for **Hack Midwest 2025**.
 
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
 
---
 
## 📄 License
 
MIT License - See [LICENSE](LICENSE) file
 
---
 
## 🔗 Links
 
- **Live Demo:** [Coming Soon]
- **Demo Video:** [3-Minute Video](#)
- **Architecture Docs:** [COMPLETE_ARCHITECTURE_OVERVIEW.md](./COMPLETE_ARCHITECTURE_OVERVIEW.md)
- **GitHub:** [Repository Link](#)
- **SBC Telegram:** https://t.me/+cKrTnXrus_43NWMx
 
---
 
## 🙏 Acknowledgments
 
- **Strands** for the powerful multi-agent framework
- **Brale/SBC** for gasless payment infrastructure
- **LiFi** for cross-chain DEX aggregation
- **AWS Bedrock** for Claude Sonnet 4 access
- **Base** for fast, cheap L2 transactions
- **Hack Midwest 2025** organizers and sponsors
 
---
 
**Built with ❤️ for Hack Midwest 2025**
 
🚀 *Revolutionizing AI-powered development with decentralized micropayments*
 
