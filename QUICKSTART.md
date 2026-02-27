# ⚡ QUICK START GUIDE
**Get Solana AML Suite running in 15 minutes**

---

## 🎯 Absolute Minimum to Get Running

### Prerequisites (5 minutes)
```bash
# macOS
brew install postgresql redis node

# Ubuntu/Debian
sudo apt install postgresql redis-server nodejs npm

# Start services
brew services start postgresql redis  # macOS
sudo service postgresql start && sudo service redis-server start  # Linux
```

### Installation (5 minutes)
```bash
# 1. Clone/extract project
cd solana-aml-suite

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Edit config (IMPORTANT!)
cd backend
cp .env.example .env
nano .env  # or use your favorite editor

# REQUIRED: Add your Solana RPC URL
# Get free key at https://dev.helius.xyz/
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
HELIUS_API_KEY=your_helius_key_here
```

### Start Everything (5 minutes)
```bash
# From project root
./start.sh

# Wait 30 seconds for services to start
# Open browser: http://localhost:3000
```

**That's it! You're running.** 🚀

---

## 🔧 Detailed Setup (If Issues)

### Step 1: Database
```bash
# Create database
createdb solana_aml

# Load schema
psql -U postgres -d solana_aml -f db-schema.sql

# Verify
psql -U postgres -d solana_aml -c "SELECT COUNT(*) FROM wallets;"
# Should return: 0 (empty but table exists)
```

### Step 2: Backend
```bash
cd backend

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Test
npm start
# Should see: "Server: http://localhost:3001"
```

### Step 3: Frontend
```bash
cd frontend

# Install
npm install

# Configure
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Test
npm run dev
# Should see: "Ready on http://localhost:3000"
```

### Step 4: Start Indexer
```bash
cd backend
node src/indexer.js

# Should see transactions being indexed
# Let it run for 2-3 minutes to collect data
```

---

## 🎮 Using the Dashboard

### 1. View Stats
- Open http://localhost:3000
- Top cards show total transactions, wallets, flags, blacklist

### 2. Search a Wallet
```
Search bar → Paste Solana address → Enter
Example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### 3. See Risk Score
- Risk score 0-100 appears
- Green (0-39) = Low risk
- Yellow (40-69) = Medium risk
- Red (70-100) = High risk

### 4. Blacklist an Address
- Click "Blacklist" button
- Enter reason
- Confirm
- Address now blocked

### 5. Monitor Transactions
- Scroll down to transaction feed
- New transactions appear in real-time
- Flagged ones highlighted in red

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
pg_isready

# Check Redis is running
redis-cli ping
# Should return: PONG

# Check port 3001 is available
lsof -i :3001
# If occupied, kill it: kill -9 <PID>
```

### Frontend won't start
```bash
# Check port 3000 is available
lsof -i :3000

# Check backend is running
curl http://localhost:3001/api/health
# Should return: {"status":"healthy"}
```

### No transactions showing
```bash
# Check indexer is running
ps aux | grep indexer.js

# Check database has data
psql -U postgres -d solana_aml -c "SELECT COUNT(*) FROM transactions;"

# If 0, wait 2-3 minutes for indexer to collect data
# Or check your Solana RPC URL is valid
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo service postgresql status  # Linux
brew services list | grep postgres  # macOS

# Check database exists
psql -U postgres -l | grep solana_aml

# Recreate if needed
dropdb solana_aml
createdb solana_aml
psql -U postgres -d solana_aml -f db-schema.sql
```

---

## 🎯 Testing Checklist

Before demo/submission:
- [ ] Open http://localhost:3000 - loads without errors
- [ ] Stats cards show numbers
- [ ] Search any Solana address - returns risk score
- [ ] Transaction feed shows recent txns
- [ ] Click blacklist button - works
- [ ] WebSocket indicator shows "Live" (green dot)
- [ ] Charts render properly
- [ ] No console errors in browser (F12)
- [ ] Backend running without crashes

---

## 📦 What's Running?

When you run `./start.sh`, you have:

1. **Backend API** (port 3001)
   - REST endpoints
   - WebSocket server
   - Database queries

2. **Transaction Indexer**
   - Fetches Solana transactions
   - Detects patterns
   - Calculates risk scores

3. **Frontend Dashboard** (port 3000)
   - React app
   - Real-time updates
   - Charts and visualization

---

## 🔑 Getting API Keys (Free)

### Helius (Required)
1. Go to https://dev.helius.xyz/
2. Sign up (free)
3. Create API key
4. Add to `backend/.env`:
   ```
   HELIUS_API_KEY=your_key_here
   SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key_here
   ```

### Alternative: Use Default Devnet (No Key)
```env
# In backend/.env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```
*Less data, but works without API key*

---

## 🚀 Deploying (For Bounty Submission)

### Frontend → Vercel (Free)
```bash
cd frontend
npm install -g vercel
vercel login
vercel

# Follow prompts
# Add environment variable: NEXT_PUBLIC_API_URL=<your_backend_url>
```

### Backend → Railway (Free)
1. Go to https://railway.app/
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Add environment variables from .env
6. Deploy

### Database → Railway/Supabase
1. Railway: Add PostgreSQL service
2. Or Supabase: https://supabase.com/ (free tier)
3. Copy connection string to backend

---

## 💡 Pro Tips

1. **Demo Data**: Let indexer run for 5-10 minutes to collect good data
2. **Search Examples**: Use well-known addresses for demos (whales, exchanges)
3. **Video Recording**: Use Loom or OBS Studio at 1080p
4. **Screenshots**: Take clean screenshots for README
5. **Git**: Commit often, push before deploying

---

## 📞 Help

Stuck? Check:
1. This guide's Troubleshooting section
2. README.md for detailed docs
3. BUILD_PLAN.md for architecture details
4. Solana Discord: https://discord.gg/solana

---

## ✅ Ready for Demo?

Final checklist:
- [ ] All services running
- [ ] Dashboard accessible
- [ ] Can search wallets
- [ ] Transactions showing
- [ ] Charts rendering
- [ ] No errors in console
- [ ] Know what you're going to say
- [ ] Practiced once

**YOU'RE READY. GO WIN THIS THING!** 🏆
