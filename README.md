# 🛡️ Solana AML Compliance Suite

> Real-time Anti-Money Laundering monitoring and compliance platform for Solana blockchain

![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF?logo=solana)
![License](https://img.shields.io/badge/license-MIT-blue)
![Built](https://img.shields.io/badge/built%20in-4%20days-red)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Railway](https://img.shields.io/badge/backend-Railway-purple)
![Vercel](https://img.shields.io/badge/frontend-Vercel-black)

## 🔗 Live Links

| | Link |
|---|---|
| 🌐 **Live Demo** | [solana-aml-suite-j275rj0be-kodeiralas-projects.vercel.app](https://solana-aml-suite-j275rj0be-kodeiralas-projects.vercel.app) |
| 🔧 **Backend API** | [solana-aml-suite-production.up.railway.app](https://solana-aml-suite-production.up.railway.app/api/health) |
| 📦 **GitHub** | [github.com/kodeirala/Solana-aml-suite](https://github.com/kodeirala/Solana-aml-suite) |
| 📹 **Demo Video** | https://youtu.be/LkVrUxWMY70 |

**Test credentials:** Email: `demo@aml.com` / Password: `Demo1234!`

---

## 🎯 Problem Statement

Cryptocurrency exchanges and DeFi protocols face a **$200B+ compliance challenge**:

- **Regulatory Pressure**: Binance paid $4.3B in AML violation fines in 2023
- **Lack of Tools**: Solana ecosystem has minimal AML monitoring infrastructure  
- **Manual Processes**: Current compliance is reactive, not proactive
- **Risk Exposure**: Protocols unknowingly facilitate money laundering

**The Result**: Projects get shut down, users lose access, entire ecosystems suffer reputational damage.

## 💡 Solution

A **real-time AML compliance platform** specifically built for Solana that:

✅ **Monitors** all transactions in real-time using Helius RPC  
✅ **Analyzes** wallet behavior with risk scoring (0-100)  
✅ **Detects** suspicious patterns (structuring, rapid movement, mixer usage)  
✅ **Blocks** high-risk transfers automatically via Token Extensions Transfer Hook  
✅ **Reports** compliance data for regulators in auditable format  
✅ **Visualizes** wallet relationship networks with D3.js force graph  

### How It Works

```
User Transfer → Transfer Hook → Risk Check → Allow/Block → Alert Dashboard
```

1. **Transaction Indexer** pulls Solana mainnet transactions via Helius RPC
2. **Risk Engine** analyzes patterns and assigns risk scores (0-100)
3. **Smart Contract** enforces blacklist via Token Extensions Transfer Hook
4. **Dashboard** provides real-time monitoring for compliance teams

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Vercel - Next.js 14)                 │
│     Batman Dark Theme · Real-time WebSocket Updates         │
│     Dashboard · Network Graph · Alerts · Blacklist          │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS + WSS
┌─────────────────▼───────────────────────────────────────────┐
│              BACKEND API (Railway - Node.js)                │
│  REST API · WebSocket · Auth (JWT) · Pattern Detection      │
└─────────┬───────────────┬───────────────┬───────────────────┘
          │               │               │
┌─────────▼─────┐ ┌──────▼──────┐ ┌──────▼──────────────────┐
│  TRANSACTION  │ │  RISK ENGINE │ │   SMART CONTRACT        │
│   INDEXER     │ │              │ │   (Token Extension)     │
│               │ │  • Velocity  │ │                         │
│  PostgreSQL   │ │  • Patterns  │ │  • Transfer Hook        │
│  (Railway)    │ │  • Scoring   │ │  • Blacklist Registry   │
└───────────────┘ └──────────────┘ └─────────────────────────┘
                          │
              ┌───────────▼──────────┐
              │   Solana Mainnet     │
              │   Helius RPC         │
              └──────────────────────┘
```

## ✨ Key Features

### 🔍 Real-Time Transaction Monitoring
- Live indexing of Solana mainnet transactions via Helius RPC
- WebSocket push notifications for suspicious activity
- Historical transaction analysis with 24h activity charts
- Color-coded risk levels (green/yellow/red)

### 📊 Risk Scoring (0-100)
Our algorithm considers:
- **Transaction Velocity**: High frequency = suspicious
- **Amount Patterns**: Large or suspicious round numbers  
- **Wallet Age**: New wallets = higher risk
- **Known Bad Actors**: OFAC/blacklist integration
- **Behavioral Patterns**: Structuring, rapid movement, mixer usage

### 🚨 Pattern Detection
Automatically flags:
- **Structuring**: Multiple transactions just under reporting thresholds
- **Rapid Movement**: Funds moving through 5+ wallets quickly
- **Round Numbers**: Exact round amounts (10K, 50K, 100K SOL)
- **High Velocity**: Unusual transaction frequency (10+ txns/hour)

### 🕸️ Network Graph Visualization
- D3.js force-directed graph showing wallet connections
- Color-coded nodes by risk score
- Transaction flow arrows with SOL volume labels
- Interactive — zoom, pan, drag nodes, click to explore

### 🔒 On-Chain Enforcement (Token Extensions)
- SPL Token with Transfer Hook Extension
- Automatic blocking of blacklisted addresses
- Immutable audit trail on Solana
- Decentralized compliance enforcement

### 📈 Compliance Dashboard
- Real-time transaction feed with risk badges
- Wallet network analysis
- Blacklist management (manual + auto at 90+ risk)
- Multi-severity alert system (critical/high/medium/low)

## 🚀 Tech Stack

**Frontend**
- Next.js 14 (React 18 + TypeScript)
- TailwindCSS (Batman dark theme)
- Recharts (bar/pie/line charts)
- D3.js (network graph)
- Orbitron + Rajdhani + Share Tech Mono fonts

**Backend**
- Node.js + Express
- PostgreSQL (Railway)
- WebSocket (real-time alerts)
- JWT authentication (PBKDF2 + HMAC-SHA256)

**Blockchain**
- Solana Web3.js
- Anchor Framework
- Token Extensions (Transfer Hook)
- Helius RPC (mainnet data)

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis

### 1. Clone Repository

```bash
git clone https://github.com/kodeirala/Solana-aml-suite.git
cd Solana-aml-suite
```

### 2. Setup Database

```bash
createdb solana_aml
psql -U postgres -d solana_aml -f db-schema.sql
```

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 4. Setup Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev
```

### 5. Start Indexer

```bash
cd backend
node src/indexer.js
```

### 6. Seed Demo Data

```bash
cd backend
node scripts/seed.js
```

Visit `http://localhost:3000` 🦇

## 📊 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/wallet/:address/risk` | GET | Wallet risk score |
| `/api/wallet/:address/network` | GET | Wallet connections |
| `/api/transactions` | GET | Recent transactions |
| `/api/blacklist` | GET/POST | Manage blacklist |
| `/api/alerts` | GET | Get alerts |
| `/api/stats` | GET | Platform statistics |

## 🎯 Business Model

### SaaS Pricing
- **Starter**: $500/month — 10K transactions/mo
- **Professional**: $2,000/month — 100K transactions/mo  
- **Enterprise**: Custom — Unlimited + white-label

### Target Customers
- DEXs and DeFi Protocols
- NFT Marketplaces
- Crypto Payment Processors
- DAOs with treasuries

### Revenue Projection
- 50 protocols × $2,000/month = **$100K MRR**
- Total Addressable Market: $200B+ compliance industry

## 🏆 Competitive Advantages

| Feature | Us | Chainalysis | TRM Labs |
|---|---|---|---|
| Solana-native | ✅ | ❌ | ❌ |
| On-chain enforcement | ✅ | ❌ | ❌ |
| Real-time blocking | ✅ | ❌ | ❌ |
| Affordable pricing | ✅ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ |

## 🚧 Roadmap

**Phase 1 (Completed ✅)**
- [x] Transaction indexer (Helius mainnet)
- [x] Risk scoring algorithm (0-100)
- [x] Pattern detection (structuring, rapid movement, etc)
- [x] Smart contract with Transfer Hook
- [x] Batman dark theme dashboard
- [x] D3.js network graph
- [x] JWT authentication
- [x] Production deployment (Vercel + Railway)

**Phase 2 (Next 30 days)**
- [ ] Machine learning model for anomaly detection
- [ ] Telegram/email alert notifications
- [ ] PDF compliance report export
- [ ] Phantom wallet connect
- [ ] Mobile responsive improvements

**Phase 3 (90 days)**
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced ML (GNN for graph analysis)
- [ ] Regulatory reporting templates
- [ ] White-label solution
- [ ] API marketplace

## 👤 Team

- **Ayush Koirala** — Full Stack + Blockchain (Nepal 🇳🇵)
## 🐦 Built in Public

Follow the journey: https://x.com/koro_beliefs/status/202776256759117035

## 📜 License

MIT License

## 🙏 Acknowledgments

- Solana Foundation for the bounty opportunity
- Anchor Framework team
- Helius for RPC infrastructure

---

**Built with 🦇 for Solana Bounty 2025 — Nepal 🇳🇵**

*Making Solana safer, one transaction at a time.*
