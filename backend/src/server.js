// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ─── Database ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Database connection error:', err);
  else console.log('✅ Database connected:', res.rows[0].now);
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'solana_aml_super_secret_change_in_production';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken(payload) {
  // Simple JWT-like token without external deps (base64 + signature)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 * 7 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// ─── Ensure users table exists ────────────────────────────────────────────────
async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'analyst',
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Users table ready');
}

ensureUsersTable().catch(console.error);

// ─── WebSocket ────────────────────────────────────────────────────────────────
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Validation
    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    if (userName.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if email/username already taken
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), userName.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email or username already in use' });
    }

    // Create user
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'analyst')
       RETURNING id, username, email, role, created_at`,
      [userName.toLowerCase(), email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    console.log(`✅ New user registered: ${user.email}`);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        userName: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      token,
      user: {
        id: user.id,
        userName: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists (but don't reveal if they don't)
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length > 0) {
      // In production: generate reset token, send email
      // For demo: just log it
      console.log(`🔑 Password reset requested for: ${email}`);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// GET /api/auth/user  (protected)
app.get('/api/auth/user', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      userName: u.username,
      email: u.email,
      role: u.role,
      lastLogin: u.last_login,
      createdAt: u.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// PUT /api/auth/profile  (protected)
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { userName } = req.body;

    if (userName && userName.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    await pool.query(
      `UPDATE users SET username = COALESCE($1, username), updated_at = NOW() WHERE id = $2`,
      [userName?.toLowerCase(), req.user.id]
    );

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// CORE AML ROUTES
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/wallet/:address/risk', async (req, res) => {
  try {
    const { address } = req.params;
    const walletQuery = await pool.query('SELECT * FROM wallets WHERE address = $1', [address]);

    if (walletQuery.rows.length === 0) {
      const riskScore = await pool.query(
        'SELECT calculate_wallet_risk_score($1) as risk_score', [address]
      );
      return res.json({
        address,
        risk_score: riskScore.rows[0].risk_score || 50,
        total_transactions: 0,
        total_volume_sol: 0,
        is_blacklisted: false,
        first_seen: new Date().toISOString(),
        status: 'new_wallet',
      });
    }

    const wallet = walletQuery.rows[0];
    const patternsQuery = await pool.query(
      `SELECT pattern_type, severity, description, detected_at 
       FROM risk_patterns WHERE wallet_address = $1 AND resolved = FALSE 
       ORDER BY detected_at DESC LIMIT 5`,
      [address]
    );
    const txnsQuery = await pool.query(
      `SELECT signature, from_address, to_address, amount, block_time, is_flagged
       FROM transactions WHERE from_address = $1 OR to_address = $1 
       ORDER BY block_time DESC LIMIT 10`,
      [address]
    );

    res.json({
      address: wallet.address,
      risk_score: wallet.risk_score,
      total_transactions: wallet.total_transactions,
      total_volume_sol: parseFloat(wallet.total_volume_sol),
      is_blacklisted: wallet.is_blacklisted,
      blacklist_reason: wallet.blacklist_reason,
      first_seen: wallet.first_seen,
      last_activity: wallet.last_activity,
      risk_patterns: patternsQuery.rows,
      recent_transactions: txnsQuery.rows,
    });
  } catch (error) {
    console.error('Error getting wallet risk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const flaggedOnly = req.query.flagged === 'true';

    let query = `
      SELECT t.*, w_from.risk_score as from_risk, w_to.risk_score as to_risk
      FROM transactions t
      LEFT JOIN wallets w_from ON t.from_address = w_from.address
      LEFT JOIN wallets w_to ON t.to_address = w_to.address
    `;
    if (flaggedOnly) query += ' WHERE t.is_flagged = TRUE';
    query += ' ORDER BY t.block_time DESC LIMIT $1 OFFSET $2';

    const result = await pool.query(query, [limit, offset]);
    res.json({ transactions: result.rows, limit, offset, count: result.rows.length });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/blacklist', async (req, res) => {
  try {
    const { address, reason, source = 'manual' } = req.body;
    if (!address || !reason) return res.status(400).json({ error: 'Address and reason required' });

    await pool.query(
      `INSERT INTO blacklist (address, source, reason, severity) VALUES ($1, $2, $3, 'high') ON CONFLICT (address) DO NOTHING`,
      [address, source, reason]
    );
    await pool.query(
      `UPDATE wallets SET is_blacklisted = TRUE, blacklist_reason = $2, risk_score = 100, updated_at = NOW() WHERE address = $1`,
      [address, reason]
    );
    await pool.query(
      `INSERT INTO alerts (alert_type, severity, wallet_address, message) VALUES ('blacklist_added', 'high', $1, $2)`,
      [address, `Address blacklisted: ${reason}`]
    );

    broadcast({ type: 'blacklist_added', data: { address, reason, timestamp: new Date().toISOString() } });
    res.json({ success: true, address, reason, message: 'Address successfully blacklisted' });
  } catch (error) {
    console.error('Error blacklisting address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/blacklist/:address', async (req, res) => {
  try {
    const { address } = req.params;
    await pool.query('DELETE FROM blacklist WHERE address = $1', [address]);
    await pool.query(
      `UPDATE wallets SET is_blacklisted = FALSE, blacklist_reason = NULL, updated_at = NOW() WHERE address = $1`,
      [address]
    );
    await pool.query('SELECT calculate_wallet_risk_score($1)', [address]);
    broadcast({ type: 'blacklist_removed', data: { address, timestamp: new Date().toISOString() } });
    res.json({ success: true, message: 'Address removed from blacklist' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blacklist', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, w.risk_score, w.total_transactions FROM blacklist b
      LEFT JOIN wallets w ON b.address = w.address ORDER BY b.added_at DESC
    `);
    res.json({ blacklist: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === 'true';
    let query = 'SELECT * FROM alerts';
    if (unreadOnly) query += ' WHERE is_read = FALSE';
    query += ' ORDER BY created_at DESC LIMIT $1';
    const result = await pool.query(query, [limit]);
    res.json({ alerts: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM wallets) as total_wallets,
        (SELECT COUNT(*) FROM wallets WHERE is_blacklisted = TRUE) as blacklisted_wallets,
        (SELECT COUNT(*) FROM transactions WHERE is_flagged = TRUE) as flagged_transactions,
        (SELECT COUNT(*) FROM alerts WHERE is_read = FALSE) as unread_alerts,
        (SELECT COALESCE(AVG(risk_score), 0) FROM wallets) as avg_risk_score,
        (SELECT COUNT(*) FROM risk_patterns WHERE resolved = FALSE) as active_patterns
    `);

    const recentActivity = await pool.query(`
      SELECT DATE_TRUNC('hour', block_time) as hour, COUNT(*) as count
      FROM transactions WHERE block_time > NOW() - INTERVAL '24 hours'
      GROUP BY hour ORDER BY hour DESC
    `);

    const riskDistribution = await pool.query(`
      SELECT 
        CASE WHEN risk_score >= 70 THEN 'high' WHEN risk_score >= 40 THEN 'medium' ELSE 'low' END as risk_level,
        COUNT(*) as count
      FROM wallets GROUP BY risk_level
    `);

    res.json({
      stats: stats.rows[0],
      recent_activity: recentActivity.rows,
      risk_distribution: riskDistribution.rows,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.status(400).json({ error: 'Query must be at least 3 characters' });

    const result = await pool.query(
      `SELECT address, risk_score, total_transactions, is_blacklisted FROM wallets WHERE address ILIKE $1 LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ results: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/wallet/:address/network', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT from_wallet, to_wallet, transaction_count, total_volume_sol, relationship_score
       FROM wallet_relationships WHERE from_wallet = $1 OR to_wallet = $1
       ORDER BY transaction_count DESC LIMIT 50`,
      [req.params.address]
    );
    res.json({ center: req.params.address, connections: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🛡️  Solana AML Suite Backend          ║
  ║   📡 Server: http://localhost:${PORT}     ║
  ║   🔌 WebSocket: ws://localhost:${PORT}    ║
  ║   🔐 Auth: /api/auth/login|signup        ║
  ╚══════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  server.close(() => { pool.end(); process.exit(0); });
});

module.exports = { app, pool, broadcast };
