# ✅ 4-DAY SPRINT CHECKLIST

Track your progress. Check boxes as you go. Stay on schedule.

---

## 📅 DAY 1: FOUNDATION

### Morning (0-6 hours)
- [ ] Clone/setup project structure
- [ ] Install PostgreSQL
- [ ] Install Redis
- [ ] Run database schema (`psql -U postgres -d solana_aml -f db-schema.sql`)
- [ ] Verify database connection
- [ ] Backend: Install dependencies (`cd backend && npm install`)
- [ ] Backend: Create .env from .env.example
- [ ] Backend: Add Solana RPC URL to .env
- [ ] Frontend: Install dependencies (`cd frontend && npm install`)
- [ ] Frontend: Create .env.local
- [ ] Test backend starts (`npm start`)
- [ ] Test frontend starts (`npm run dev`)

### Afternoon (6-12 hours)
- [ ] Test Solana RPC connection
- [ ] Get Helius API key (https://dev.helius.xyz/)
- [ ] Add Helius key to .env
- [ ] Test indexer can fetch transactions
- [ ] Verify transactions save to database
- [ ] Check PostgreSQL has data (`SELECT COUNT(*) FROM transactions;`)
- [ ] Test triggers are working
- [ ] Index at least 100 transactions

### Evening (12-18 hours)
- [ ] Test risk scoring function in database
- [ ] Create API endpoint for wallet risk
- [ ] Test API with curl/Postman
- [ ] Get risk scores for 10+ wallets
- [ ] Verify risk scores make sense
- [ ] Test blacklist add/remove functions

### Night (18-24 hours)
- [ ] Frontend shows transaction list
- [ ] Frontend search bar works
- [ ] Can search wallet and see risk score
- [ ] Real-time updates via WebSocket working
- [ ] Dashboard looks decent (doesn't need to be pretty yet)

**Day 1 Goal**: Backend works, can search wallets, see risk scores ✅

---

## 📅 DAY 2: SMART CONTRACT

### Morning (24-30 hours)
- [ ] Install Rust (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- [ ] Install Solana CLI
- [ ] Install Anchor CLI
- [ ] Create Solana wallet (`solana-keygen new`)
- [ ] Get devnet SOL (`solana airdrop 2`)
- [ ] Initialize Anchor project
- [ ] Copy smart contract code to `programs/aml-token/src/lib.rs`

### Afternoon (30-36 hours)
- [ ] Build smart contract (`anchor build`)
- [ ] Fix any compilation errors
- [ ] Deploy to devnet (`anchor deploy`)
- [ ] Copy program ID to Anchor.toml
- [ ] Rebuild and redeploy
- [ ] Verify contract is on-chain (use Solana Explorer)

### Evening (36-42 hours)
- [ ] Test initialize_blacklist function
- [ ] Test add_to_blacklist function
- [ ] Test remove_from_blacklist function
- [ ] Backend can call smart contract functions
- [ ] Create API endpoint for on-chain blacklist
- [ ] Test: Add address via backend → Check on-chain

### Night (42-48 hours)
- [ ] Implement structuring detection
- [ ] Implement rapid movement detection
- [ ] Implement round number detection
- [ ] Implement high velocity detection
- [ ] Test pattern detection with sample data
- [ ] Patterns saved to database
- [ ] Alerts created for patterns

**Day 2 Goal**: Smart contract deployed, pattern detection working ✅

---

## 📅 DAY 3: POLISH & UX

### Morning (48-54 hours)
- [ ] Dashboard: Create stats overview cards
- [ ] Dashboard: Add transaction filters
- [ ] Dashboard: Improve search UX
- [ ] Dashboard: Add blacklist management page
- [ ] Dashboard: Wallet detail page with history
- [ ] Mobile responsive (test on phone)

### Afternoon (54-60 hours)
- [ ] Add risk distribution pie chart
- [ ] Add transaction volume line chart
- [ ] Add alerts timeline
- [ ] Network graph (if time permits)
- [ ] Make everything look professional
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success messages

### Evening (60-66 hours)
- [ ] WebSocket alerts with toast notifications
- [ ] Sound notification (optional)
- [ ] Alert history page
- [ ] Mark alerts as read
- [ ] Real-time transaction updates working smoothly

### Night (66-72 hours)
- [ ] Multi-protocol support (mock if needed)
- [ ] API key generation (mock if needed)
- [ ] Usage statistics page
- [ ] Billing page (mock UI only)
- [ ] Make it look like a real SaaS product

**Day 3 Goal**: Dashboard looks amazing, all features work ✅

---

## 📅 DAY 4: SHIP IT

### Morning (72-78 hours)
- [ ] Test every feature end-to-end
- [ ] Search 20+ random wallets - all work?
- [ ] Add 5 addresses to blacklist - all work?
- [ ] Check transaction feed updates in real-time
- [ ] Test on mobile
- [ ] Fix any critical bugs
- [ ] No console errors in browser
- [ ] Backend has no crashes

### Afternoon (78-84 hours)
- [ ] Write comprehensive README.md
- [ ] Add architecture diagram to README
- [ ] Document setup instructions
- [ ] Document API endpoints
- [ ] Add screenshots to README
- [ ] Write project description
- [ ] Add team member info
- [ ] Add license

### Evening (84-90 hours)
- [ ] Record demo video (3 minutes max)
- [ ] Show problem (30 sec)
- [ ] Show solution (30 sec)
- [ ] Demo all features (90 sec)
- [ ] Show impact (30 sec)
- [ ] Edit video
- [ ] Add background music
- [ ] Add text overlays
- [ ] Export at 1080p
- [ ] Upload to YouTube

### Night (90-96 hours)
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render/Railway
- [ ] Test deployed version works
- [ ] Update README with live links
- [ ] Push final code to GitHub
- [ ] Make repo public
- [ ] Add demo video link to README
- [ ] Create nice GitHub README preview

**Final Push**:
- [ ] Post on Twitter/X with demo video
- [ ] Post on LinkedIn
- [ ] Submit to bounty platform
- [ ] Fill out all submission fields
- [ ] Include GitHub link
- [ ] Include demo video link
- [ ] Include live demo link
- [ ] Submit before deadline!

**Day 4 Goal**: Shipped, deployed, submitted ✅

---

## 🎯 CRITICAL SUCCESS METRICS

Must have to win:
- [x] Smart contract deployed on Devnet
- [x] Frontend deployed and accessible
- [x] Can search wallets and see risk scores
- [x] Pattern detection working
- [x] Real-time transaction monitoring
- [x] Blacklist functionality works end-to-end
- [x] 3-minute demo video on YouTube
- [x] GitHub repo with comprehensive README
- [x] Professional-looking UI

Nice to have (bonus points):
- [ ] Actual ML model (even simple)
- [ ] Network graph visualization
- [ ] 1000+ transactions indexed
- [ ] Telegram bot integration
- [ ] Solana Mobile integration
- [ ] White paper / docs site

---

## 🚨 IF YOU'RE RUNNING BEHIND

### Cut these first:
- Network graph visualization (hardest)
- Email alerts (WebSocket is enough)
- ML model (rule-based detection is fine)
- Mobile app features
- Fancy animations

### Keep these at all costs:
- Smart contract with Transfer Hook
- Risk scoring working
- Pattern detection (at least 2 types)
- Dashboard with search
- Demo video
- README

---

## 💪 DAILY STANDUP

End of each day, ask yourself:
1. Did I hit today's goal?
2. What's blocking me?
3. Do I need to cut scope?
4. Am I on track to finish?

If no to #4, cut scope immediately. Better to ship something working than nothing at all.

---

## 📞 EMERGENCY CONTACTS

If stuck:
- Solana Discord: https://discord.gg/solana
- Anchor Discord: https://discord.gg/anchor
- Stack Overflow: Tag `solana`
- Reddit: r/solana, r/solanadev

---

## 🎉 FINAL CHECKLIST (Day 4, Hour 95)

Before hitting submit:
- [ ] Video uploaded to YouTube
- [ ] Video is public
- [ ] GitHub repo is public
- [ ] README has demo video link
- [ ] README has live demo link
- [ ] Live demo actually works
- [ ] No broken links in README
- [ ] All code committed and pushed
- [ ] Smart contract address in README
- [ ] Tweet posted with video
- [ ] LinkedIn post published
- [ ] Bounty form completely filled out

---

## 🚀 YOU GOT THIS

Remember:
- Done is better than perfect
- Ship working features over pretty ones
- Test constantly, don't wait for Day 4
- Sleep 6 hours minimum per day
- Eat properly
- Stay hydrated
- Take 10-min breaks every 2 hours

**THIS IS WINNABLE. GO CRUSH IT.**
