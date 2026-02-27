// src/indexer.js
require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { Pool } = require('pg');

// Try to get broadcast from server, but don't crash if unavailable
let broadcast = null;
// broadcast disabled in standalone mode

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  { commitment: 'confirmed', disableRetryOnRateLimit: false }
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BATCH_SIZE = parseInt(process.env.INDEX_BATCH_SIZE) || 25; // reduced from 100
const INTERVAL_MS = parseInt(process.env.INDEX_INTERVAL_MS) || 15000; // increased from 5000
const HIGH_RISK_THRESHOLD = parseInt(process.env.HIGH_RISK_THRESHOLD) || 70;

console.log('🔍 Transaction Indexer Starting...');
console.log(`📡 RPC: ${process.env.SOLANA_RPC_URL}`);
console.log(`⏱️  Interval: ${INTERVAL_MS}ms | Batch: ${BATCH_SIZE}`);

let lastSignature = null;
let isRunning = false;

// ─── Rate-limited fetch with retry ───────────────────────────────────────────
async function fetchWithRetry(fn, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests');
      const isLast = i === retries - 1;
      if (isLast) throw err;
      const wait = is429 ? delayMs * (i + 2) : delayMs;
      console.log(`⏳ Retry ${i + 1}/${retries} after ${wait}ms...`);
      await sleep(wait);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Pattern Detection ────────────────────────────────────────────────────────
function detectStructuring(transactions) {
  const threshold = 10000;
  const timeWindow = 3600000;
  const patterns = [];
  const walletTxns = {};

  transactions.forEach(tx => {
    if (!walletTxns[tx.from_address]) walletTxns[tx.from_address] = [];
    walletTxns[tx.from_address].push(tx);
  });

  Object.entries(walletTxns).forEach(([address, txns]) => {
    txns.sort((a, b) => a.block_time - b.block_time);
    for (let i = 0; i < txns.length - 2; i++) {
      const window = [];
      let total = 0;
      for (let j = i; j < txns.length; j++) {
        if (txns[j].block_time - txns[i].block_time <= timeWindow) {
          window.push(txns[j]);
          total += parseFloat(txns[j].amount);
        }
      }
      if (window.length >= 3 && window.every(tx => parseFloat(tx.amount) < threshold * 0.9) && total > threshold) {
        patterns.push({
          wallet_address: address,
          pattern_type: 'structuring',
          severity: 'high',
          description: `${window.length} transactions totaling ${total.toFixed(2)} SOL, each under ${threshold} SOL`,
          related_transactions: window.map(tx => tx.id),
          metadata: { count: window.length, total }
        });
      }
    }
  });
  return patterns;
}

function detectRapidMovement(transactions) {
  const patterns = [];
  const graph = {};
  transactions.forEach(tx => {
    if (!graph[tx.from_address]) graph[tx.from_address] = [];
    graph[tx.from_address].push({ to: tx.to_address, amount: parseFloat(tx.amount), time: tx.block_time, id: tx.id });
  });

  function findChains(start, visited = new Set(), chain = []) {
    if (chain.length >= 5) {
      patterns.push({
        wallet_address: start,
        pattern_type: 'rapid_movement',
        severity: 'high',
        description: `Funds moved through ${chain.length} wallets rapidly`,
        related_transactions: chain.map(c => c.id),
        metadata: { chain_length: chain.length }
      });
      return;
    }
    if (visited.has(start) || !graph[start]) return;
    visited.add(start);
    graph[start].forEach(tx => { chain.push(tx); findChains(tx.to, new Set(visited), [...chain]); });
  }

  Object.keys(graph).slice(0, 50).forEach(addr => findChains(addr));
  return patterns;
}

function detectRoundNumbers(transactions) {
  return transactions
    .filter(tx => {
      const amount = parseFloat(tx.amount);
      return (amount % 100 === 0 || amount % 1000 === 0) && amount > 1000;
    })
    .map(tx => ({
      wallet_address: tx.from_address,
      pattern_type: 'round_numbers',
      severity: 'medium',
      description: `Transaction of exactly ${tx.amount} SOL (suspicious round number)`,
      related_transactions: [tx.id],
      metadata: { amount: tx.amount }
    }));
}

function detectHighVelocity(transactions) {
  const patterns = [];
  const timeWindow = 3600000;
  const walletTxns = {};
  transactions.forEach(tx => {
    if (!walletTxns[tx.from_address]) walletTxns[tx.from_address] = [];
    walletTxns[tx.from_address].push(tx);
  });

  Object.entries(walletTxns).forEach(([address, txns]) => {
    if (txns.length >= 10) {
      const times = txns.map(tx => tx.block_time).sort();
      const span = times[times.length - 1] - times[0];
      if (span <= timeWindow) {
        patterns.push({
          wallet_address: address,
          pattern_type: 'high_velocity',
          severity: 'high',
          description: `${txns.length} transactions in ${Math.round(span / 60000)} minutes`,
          related_transactions: txns.map(tx => tx.id),
          metadata: { count: txns.length, time_span_minutes: Math.round(span / 60000) }
        });
      }
    }
  });
  return patterns;
}

// ─── Main indexer ─────────────────────────────────────────────────────────────
async function indexTransactions() {
  if (isRunning) {
    console.log('⏸️  Previous run still in progress, skipping...');
    return;
  }
  isRunning = true;

  try {
    console.log('📊 Fetching recent transactions...');

    const signatures = await fetchWithRetry(() =>
      connection.getSignaturesForAddress(
        new PublicKey('11111111111111111111111111111111'),
        { limit: BATCH_SIZE, before: lastSignature }
      )
    );

    if (!signatures || signatures.length === 0) {
      console.log('⏸️  No new transactions');
      return;
    }

    console.log(`📥 Processing ${signatures.length} transactions...`);

    const processedTxns = [];
    let skipped = 0;

    for (const sig of signatures) {
      try {
        // Rate limit protection — wait between each fetch
        await sleep(200);

        const tx = await fetchWithRetry(() =>
          connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          })
        );

        if (!tx || !tx.meta) { skipped++; continue; }

        const preBalances = tx.meta.preBalances;
        const postBalances = tx.meta.postBalances;

        // Safe account keys retrieval — handles versioned txns
        let accountKeys;
        try {
          const keys = tx.transaction.message.getAccountKeys();
          accountKeys = keys.staticAccountKeys || keys.keySegments?.()?.flat() || [];
        } catch {
          skipped++;
          continue;
        }

        if (!accountKeys || accountKeys.length < 2) { skipped++; continue; }

        for (let i = 0; i < Math.min(accountKeys.length, preBalances.length); i++) {
          const diff = (postBalances[i] || 0) - (preBalances[i] || 0);
          if (Math.abs(diff) < 1000) continue; // Skip tiny amounts (< 0.000001 SOL)

          const address = accountKeys[i]?.toBase58?.();
          if (!address) continue;

          const fromAddress = diff < 0 ? address : accountKeys[0]?.toBase58?.();
          const toAddress = diff > 0 ? address : accountKeys[1]?.toBase58?.();
          const amount = Math.abs(diff) / 1e9;

          if (!fromAddress || !toAddress || amount < 0.001) continue;

          try {
            const result = await pool.query(
              `INSERT INTO transactions (signature, from_address, to_address, amount, block_time, slot, status, fee_sol)
               VALUES ($1, $2, $3, $4, to_timestamp($5), $6, $7, $8)
               ON CONFLICT (signature) DO NOTHING RETURNING *`,
              [sig.signature, fromAddress, toAddress, amount, tx.blockTime, tx.slot,
               tx.meta.err ? 'failed' : 'success', (tx.meta.fee || 0) / 1e9]
            );
            if (result.rows.length > 0) processedTxns.push(result.rows[0]);
          } catch (dbErr) {
            // Ignore duplicate key errors silently
            if (!dbErr.message?.includes('duplicate')) {
              console.error('DB error:', dbErr.message);
            }
          }
        }
      } catch (txError) {
        // Silently skip lookup table errors — these are versioned txns we can't parse
        if (!txError.message?.includes('address table lookups')) {
          console.error(`⚠️  TX error ${sig.signature.slice(0, 8)}...: ${txError.message}`);
        }
        skipped++;
      }
    }

    console.log(`✅ Indexed ${processedTxns.length} txns | Skipped ${skipped}`);

    // Pattern detection
    if (processedTxns.length >= 5) {
      console.log('🔍 Running pattern detection...');
      const allPatterns = [
        ...detectStructuring(processedTxns),
        ...detectRapidMovement(processedTxns),
        ...detectRoundNumbers(processedTxns),
        ...detectHighVelocity(processedTxns),
      ];

      for (const pattern of allPatterns) {
        try {
          await pool.query(
            `INSERT INTO risk_patterns (wallet_address, pattern_type, severity, description, related_transactions, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [pattern.wallet_address, pattern.pattern_type, pattern.severity,
             pattern.description, pattern.related_transactions, JSON.stringify(pattern.metadata)]
          );
          await pool.query(
            `INSERT INTO alerts (alert_type, severity, wallet_address, message) VALUES ($1, $2, $3, $4)`,
            ['pattern_detected', pattern.severity, pattern.wallet_address, pattern.description]
          );
          if (broadcast) broadcast({ type: 'pattern_detected', data: pattern });
          console.log(`🚨 Pattern: ${pattern.pattern_type} → ${pattern.wallet_address.slice(0, 8)}...`);
        } catch {}
      }

      if (allPatterns.length > 0) console.log(`🔍 ${allPatterns.length} patterns detected`);
    }

    // Update risk scores
    const uniqueWallets = [...new Set(processedTxns.flatMap(tx => [tx.from_address, tx.to_address]).filter(Boolean))];
    for (const wallet of uniqueWallets.slice(0, 20)) {
      try { await pool.query('SELECT calculate_wallet_risk_score($1)', [wallet]); } catch {}
    }

    if (signatures.length > 0) lastSignature = signatures[signatures.length - 1].signature;

    if (broadcast && processedTxns.length > 0) {
      broadcast({ type: 'new_transactions', data: processedTxns.slice(0, 10) });
    }

  } catch (error) {
    console.error('❌ Indexer error:', error.message);
  } finally {
    isRunning = false;
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  console.log('🚀 Indexer started');

  // Test DB connection first
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  await indexTransactions();
  setInterval(indexTransactions, INTERVAL_MS);
}

process.on('SIGTERM', () => { pool.end(); process.exit(0); });

if (require.main === module) start();

module.exports = { indexTransactions, start };
