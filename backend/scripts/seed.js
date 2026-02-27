// scripts/seed.js
// Populates the database with realistic AML demo data
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Realistic Solana-style addresses
const WALLETS = {
  // High risk / criminal wallets
  MIXER_1:    'MixR1xKp9vF3nQ8mL2wT7aE5dC6bH4jY9sU1zP0iG',
  MIXER_2:    'MixR2yLq0wG4oR9nM3xU8bF6eD7cI5kZ0tV2aQ1jH',
  SCAMMER_1:  'ScaM1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3',
  SCAMMER_2:  'ScaM2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4',
  DARKWEB_1:  'DrkW1zY2xW3vU4tS5rQ6pO7nM8lK9jI0hG1fE2dC3',
  // Medium risk wallets
  SUSPICIOUS_1: 'SusP1cK2lM3nO4pQ5rS6tU7vW8xY9zA0bC1dE2fG3',
  SUSPICIOUS_2: 'SusP2dL3mN4oP5qR6sT7uV8vW9xX0yY1zA2bB3cC4',
  SUSPICIOUS_3: 'SusP3eM4nO5pQ6rS7tU8vV9wW0xX1yY2zZ3aA4bB5',
  // Clean wallets (exchanges, protocols)
  EXCHANGE_1: 'ExCh1aNgE2bInAnCe3dEfGhIjKlMnOpQrStUvWxYz',
  EXCHANGE_2: 'ExCh2bNgF3cJoBfP4eGhIjKlMnOpQrStUvWxYzAb1',
  PROTOCOL_1: 'PrOt1oCo2L3dEfInItE4gHiJkLmNoPqRsTuVwXyZ5',
  PROTOCOL_2: 'PrOt2oCo3L4eFgHiJkLmNoPqRsTuVwXyZaBcDeF6',
  USER_1:     'UsEr1aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgH7',
  USER_2:     'UsEr2bCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhI8',
  USER_3:     'UsEr3cDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJ9',
};

const NOW = Math.floor(Date.now() / 1000);
const HOUR = 3600;
const DAY = 86400;

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }
function ago(seconds) { return NOW - seconds; }

async function clearExisting() {
  console.log('🗑️  Clearing existing demo data...');
  await pool.query('DELETE FROM risk_patterns');
  await pool.query('DELETE FROM alerts');
  await pool.query('DELETE FROM blacklist');
  await pool.query('DELETE FROM transactions');
  await pool.query('DELETE FROM wallets');
  console.log('✅ Cleared');
}

async function seedWallets() {
  console.log('👛 Seeding wallets...');

  const walletData = [
    // Blacklisted / very high risk
    { address: WALLETS.MIXER_1,    risk: 98, tx: 342, vol: 45230.5, blacklisted: true,  reason: 'Known crypto mixer — OFAC sanctioned', first: ago(DAY * 180) },
    { address: WALLETS.MIXER_2,    risk: 95, tx: 287, vol: 38910.2, blacklisted: true,  reason: 'Tornado Cash affiliated wallet', first: ago(DAY * 90) },
    { address: WALLETS.SCAMMER_1,  risk: 92, tx: 156, vol: 12450.0, blacklisted: true,  reason: 'Reported phishing scammer — multiple victims', first: ago(DAY * 45) },
    { address: WALLETS.SCAMMER_2,  risk: 89, tx: 98,  vol: 8920.3,  blacklisted: false, reason: null, first: ago(DAY * 30) },
    { address: WALLETS.DARKWEB_1,  risk: 94, tx: 203, vol: 29100.0, blacklisted: true,  reason: 'Darkweb marketplace payment wallet', first: ago(DAY * 120) },
    // Medium risk
    { address: WALLETS.SUSPICIOUS_1, risk: 67, tx: 89,  vol: 4230.1, blacklisted: false, reason: null, first: ago(DAY * 20) },
    { address: WALLETS.SUSPICIOUS_2, risk: 58, tx: 134, vol: 7810.5, blacklisted: false, reason: null, first: ago(DAY * 15) },
    { address: WALLETS.SUSPICIOUS_3, risk: 72, tx: 67,  vol: 3100.0, blacklisted: false, reason: null, first: ago(DAY * 10) },
    // Clean
    { address: WALLETS.EXCHANGE_1, risk: 12, tx: 8934, vol: 1230450.0, blacklisted: false, reason: null, first: ago(DAY * 365) },
    { address: WALLETS.EXCHANGE_2, risk: 8,  tx: 5621, vol: 890230.5,  blacklisted: false, reason: null, first: ago(DAY * 300) },
    { address: WALLETS.PROTOCOL_1, risk: 5,  tx: 2341, vol: 456780.2,  blacklisted: false, reason: null, first: ago(DAY * 200) },
    { address: WALLETS.PROTOCOL_2, risk: 15, tx: 1876, vol: 234560.8,  blacklisted: false, reason: null, first: ago(DAY * 150) },
    { address: WALLETS.USER_1,     risk: 22, tx: 45,   vol: 890.5,     blacklisted: false, reason: null, first: ago(DAY * 60) },
    { address: WALLETS.USER_2,     risk: 18, tx: 67,   vol: 1230.2,    blacklisted: false, reason: null, first: ago(DAY * 45) },
    { address: WALLETS.USER_3,     risk: 31, tx: 23,   vol: 450.8,     blacklisted: false, reason: null, first: ago(DAY * 30) },
  ];

  for (const w of walletData) {
    await pool.query(
      `INSERT INTO wallets (address, risk_score, total_transactions, total_volume_sol, is_blacklisted, blacklist_reason, first_seen, last_activity, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), to_timestamp($8), NOW())
       ON CONFLICT (address) DO UPDATE SET
         risk_score = $2, total_transactions = $3, total_volume_sol = $4,
         is_blacklisted = $5, blacklist_reason = $6, updated_at = NOW()`,
      [w.address, w.risk, w.tx, w.vol, w.blacklisted, w.reason, w.first, ago(randInt(0, HOUR * 2))]
    );
  }
  console.log(`✅ ${walletData.length} wallets seeded`);
}

async function seedBlacklist() {
  console.log('🚫 Seeding blacklist...');

  const entries = [
    { address: WALLETS.MIXER_1,   source: 'ofac',     reason: 'OFAC SDN List — Crypto Mixer',           severity: 'critical' },
    { address: WALLETS.MIXER_2,   source: 'chainalysis', reason: 'Tornado Cash affiliated',              severity: 'critical' },
    { address: WALLETS.SCAMMER_1, source: 'manual',   reason: 'Reported phishing scammer — 47 victims', severity: 'high' },
    { address: WALLETS.DARKWEB_1, source: 'dea',      reason: 'DEA investigation — darkweb marketplace', severity: 'critical' },
  ];

  for (const e of entries) {
    await pool.query(
      `INSERT INTO blacklist (address, source, reason, severity, added_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (address) DO NOTHING`,
      [e.address, e.source, e.reason, e.severity]
    );
  }
  console.log(`✅ ${entries.length} blacklist entries seeded`);
}

async function seedTransactions() {
  console.log('💸 Seeding transactions...');

  const txns = [];

  // SCENARIO 1: Structuring — SCAMMER_1 breaks up large amount into small txns
  for (let i = 0; i < 8; i++) {
    txns.push({
      sig: `STR1${i}xKp9vF3nQ8mL2wT7aE5dC6bH4jY9sU1zP0iG${i}AbCdEfGhIjKlMnOpQrStUvWxYz`,
      from: WALLETS.SCAMMER_1, to: WALLETS.SUSPICIOUS_1,
      amount: rand(8900, 9900), time: ago(HOUR * 2 + i * 600), flagged: true,
    });
  }

  // SCENARIO 2: Rapid movement — funds hop through mixer chain
  const chain = [WALLETS.MIXER_1, WALLETS.SUSPICIOUS_1, WALLETS.SUSPICIOUS_2, WALLETS.SUSPICIOUS_3, WALLETS.SCAMMER_2];
  for (let i = 0; i < chain.length - 1; i++) {
    txns.push({
      sig: `RPD1${i}yLq0wG4oR9nM3xU8bF6eD7cI5kZ0tV2aQ1jH${i}BcDeFgHiJkLmNoPqRsTuVwXyZ`,
      from: chain[i], to: chain[i + 1],
      amount: rand(4500, 5500), time: ago(HOUR * 6 + i * 300), flagged: true,
    });
  }

  // SCENARIO 3: Round number transactions from darkweb wallet
  const roundAmounts = [10000, 50000, 100000, 25000, 75000];
  roundAmounts.forEach((amount, i) => {
    txns.push({
      sig: `RND1${i}zY2xW3vU4tS5rQ6pO7nM8lK9jI0hG1fE2dC3${i}CdEfGhIjKlMnOpQrStUvWxYzA`,
      from: WALLETS.DARKWEB_1, to: WALLETS.MIXER_2,
      amount, time: ago(DAY + i * HOUR), flagged: true,
    });
  });

  // SCENARIO 4: Normal exchange activity (clean)
  for (let i = 0; i < 20; i++) {
    txns.push({
      sig: `CLN1${i}aNgE2bInAnCe3dEfGhIjKlMnOpQrStUvWxYz${i}DeFgHiJkLmNoPqRsTuVwXyZaB`,
      from: WALLETS.EXCHANGE_1, to: WALLETS.USER_1,
      amount: rand(0.5, 50), time: ago(i * 1800), flagged: false,
    });
  }

  // SCENARIO 5: 24h activity data for charts
  for (let h = 0; h < 24; h++) {
    const count = h >= 9 && h <= 17 ? randInt(8, 20) : randInt(2, 8);
    for (let j = 0; j < count; j++) {
      txns.push({
        sig: `ACT${h}${j}bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4${h}${j}EfGhIjKlMnOpQrStUvWxYzAb`,
        from: j % 2 === 0 ? WALLETS.PROTOCOL_1 : WALLETS.EXCHANGE_2,
        to: j % 3 === 0 ? WALLETS.USER_2 : WALLETS.USER_3,
        amount: rand(0.1, 100), time: ago(DAY - h * HOUR - j * 120), flagged: false,
      });
    }
  }

  // Insert all transactions
  let inserted = 0;
  for (const tx of txns) {
    try {
      await pool.query(
        `INSERT INTO transactions (signature, from_address, to_address, amount, block_time, slot, status, is_flagged, risk_score)
         VALUES ($1, $2, $3, $4, to_timestamp($5), $6, 'success', $7, $8)
         ON CONFLICT (signature) DO NOTHING`,
        [tx.sig, tx.from, tx.to, tx.amount, tx.time,
         randInt(250000000, 280000000), tx.flagged, tx.flagged ? randInt(70, 99) : randInt(5, 35)]
      );
      inserted++;
    } catch (e) {
      if (!e.message.includes('duplicate')) console.error('TX insert error:', e.message);
    }
  }
  console.log(`✅ ${inserted} transactions seeded`);
}

async function seedPatterns() {
  console.log('🔍 Seeding risk patterns...');

  const patterns = [
    {
      wallet: WALLETS.SCAMMER_1, type: 'structuring', severity: 'high',
      desc: '8 transactions totaling 76,420 SOL, each under 10,000 SOL threshold',
    },
    {
      wallet: WALLETS.MIXER_1, type: 'rapid_movement', severity: 'high',
      desc: 'Funds moved through 5 wallets in 25 minutes — mixer pattern detected',
    },
    {
      wallet: WALLETS.DARKWEB_1, type: 'round_numbers', severity: 'medium',
      desc: '5 transactions of exact round numbers (10K, 25K, 50K, 75K, 100K SOL)',
    },
    {
      wallet: WALLETS.SUSPICIOUS_3, type: 'high_velocity', severity: 'high',
      desc: '67 transactions in 45 minutes — automated layering suspected',
    },
    {
      wallet: WALLETS.MIXER_2, type: 'structuring', severity: 'high',
      desc: '12 transactions totaling 118,000 SOL split into sub-10K amounts',
    },
    {
      wallet: WALLETS.SCAMMER_2, type: 'rapid_movement', severity: 'medium',
      desc: 'Funds traced through 3 intermediate wallets within 2 hours',
    },
  ];

  for (const p of patterns) {
    await pool.query(
      `INSERT INTO risk_patterns (wallet_address, pattern_type, severity, description, resolved, detected_at)
       VALUES ($1, $2, $3, $4, false, NOW() - interval '${randInt(1, 48)} hours')`,
      [p.wallet, p.type, p.severity, p.desc]
    );
  }
  console.log(`✅ ${patterns.length} patterns seeded`);
}

async function seedAlerts() {
  console.log('🚨 Seeding alerts...');

  const alerts = [
    { type: 'blacklist_added',    severity: 'critical', wallet: WALLETS.MIXER_1,    msg: 'CRITICAL: Wallet added to OFAC sanctions list — all transfers blocked', minsAgo: 15 },
    { type: 'pattern_detected',   severity: 'high',     wallet: WALLETS.SCAMMER_1,  msg: 'Structuring detected — 8 transactions under $10K threshold in 2 hours', minsAgo: 32 },
    { type: 'pattern_detected',   severity: 'high',     wallet: WALLETS.MIXER_1,    msg: 'Rapid fund movement — 5 wallet hops detected in 25 minutes', minsAgo: 45 },
    { type: 'high_risk_transfer', severity: 'high',     wallet: WALLETS.DARKWEB_1,  msg: 'High-risk transfer of 100,000 SOL from darkweb-associated wallet', minsAgo: 67 },
    { type: 'pattern_detected',   severity: 'medium',   wallet: WALLETS.SUSPICIOUS_3, msg: 'High velocity: 67 transactions in 45 minutes from single wallet', minsAgo: 120 },
    { type: 'pattern_detected',   severity: 'medium',   wallet: WALLETS.DARKWEB_1,  msg: 'Round number pattern: 5 transactions of exact amounts (10K-100K SOL)', minsAgo: 180 },
    { type: 'risk_score_updated', severity: 'medium',   wallet: WALLETS.SCAMMER_2,  msg: 'Risk score elevated to 89/100 — approaching auto-blacklist threshold', minsAgo: 240 },
    { type: 'pattern_detected',   severity: 'high',     wallet: WALLETS.MIXER_2,    msg: 'Tornado Cash affiliated wallet active — 287 transactions flagged', minsAgo: 360 },
    { type: 'blacklist_added',    severity: 'critical', wallet: WALLETS.DARKWEB_1,  msg: 'DEA investigation: wallet linked to darkweb marketplace payments', minsAgo: 480 },
    { type: 'new_connection',     severity: 'low',      wallet: WALLETS.SUSPICIOUS_1, msg: 'New connection detected between suspicious wallet and known mixer', minsAgo: 720 },
  ];

  for (const a of alerts) {
    await pool.query(
      `INSERT INTO alerts (alert_type, severity, wallet_address, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - interval '${a.minsAgo} minutes')`,
      [a.type, a.severity, a.wallet, a.msg, a.minsAgo > 200]
    );
  }
  console.log(`✅ ${alerts.length} alerts seeded`);
}

async function seedRelationships() {
  console.log('🕸️  Seeding wallet relationships...');

  const relationships = [
    { from: WALLETS.MIXER_1,    to: WALLETS.SUSPICIOUS_1, count: 23, vol: 45000 },
    { from: WALLETS.MIXER_1,    to: WALLETS.SUSPICIOUS_2, count: 17, vol: 32000 },
    { from: WALLETS.SCAMMER_1,  to: WALLETS.SUSPICIOUS_1, count: 8,  vol: 76420 },
    { from: WALLETS.SUSPICIOUS_1, to: WALLETS.SUSPICIOUS_2, count: 12, vol: 28000 },
    { from: WALLETS.SUSPICIOUS_2, to: WALLETS.SUSPICIOUS_3, count: 9,  vol: 21000 },
    { from: WALLETS.SUSPICIOUS_3, to: WALLETS.SCAMMER_2,   count: 6,  vol: 15000 },
    { from: WALLETS.DARKWEB_1,  to: WALLETS.MIXER_2,       count: 31, vol: 260000 },
    { from: WALLETS.EXCHANGE_1, to: WALLETS.USER_1,         count: 45, vol: 2300 },
    { from: WALLETS.EXCHANGE_1, to: WALLETS.USER_2,         count: 32, vol: 1800 },
    { from: WALLETS.PROTOCOL_1, to: WALLETS.USER_3,         count: 18, vol: 890 },
  ];

  for (const r of relationships) {
    await pool.query(
      `INSERT INTO wallet_relationships (from_wallet, to_wallet, transaction_count, total_volume_sol, relationship_score, last_interaction)
       VALUES ($1, $2, $3, $4, $5, NOW() - interval '${randInt(1, 24)} hours')
       ON CONFLICT (from_wallet, to_wallet) DO UPDATE SET
         transaction_count = $3, total_volume_sol = $4`,
      [r.from, r.to, r.count, r.vol, Math.min(100, r.count * 3)]
    );
  }
  console.log(`✅ ${relationships.length} relationships seeded`);
}

async function main() {
  console.log('\n🦇 SOLANA AML SUITE — SEED SCRIPT');
  console.log('=====================================\n');

  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  await clearExisting();
  console.log('');
  await seedWallets();
  await seedBlacklist();
  await seedTransactions();
  await seedPatterns();
  await seedAlerts();
  await seedRelationships();

  console.log('\n=====================================');
  console.log('🎉 SEED COMPLETE! Dashboard is ready.');
  console.log('=====================================');
  console.log('\nYour dashboard now has:');
  console.log('  • 15 wallets (3 blacklisted, 5 high-risk, 7 clean)');
  console.log('  • 4 blacklist entries (OFAC, DEA, Chainalysis, Manual)');
  console.log('  • 100+ realistic transactions with 24h activity data');
  console.log('  • 6 suspicious patterns (structuring, rapid movement, etc)');
  console.log('  • 10 alerts (critical → low severity)');
  console.log('  • 10 wallet relationships for network graph');
  console.log('\nGo to http://localhost:3000/dashboard 🦇\n');

  await pool.end();
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  pool.end();
  process.exit(1);
});
