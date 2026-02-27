-- Solana AML Suite Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(44) UNIQUE NOT NULL,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    total_transactions INTEGER DEFAULT 0,
    total_volume_sol DECIMAL(20, 9) DEFAULT 0,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on address for fast lookups
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_risk_score ON wallets(risk_score DESC);
CREATE INDEX idx_wallets_blacklisted ON wallets(is_blacklisted) WHERE is_blacklisted = TRUE;

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature VARCHAR(88) UNIQUE NOT NULL,
    from_address VARCHAR(44) NOT NULL,
    to_address VARCHAR(44) NOT NULL,
    amount DECIMAL(20, 9) NOT NULL,
    token_mint VARCHAR(44),
    block_time TIMESTAMP NOT NULL,
    slot BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    fee_sol DECIMAL(20, 9),
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reasons TEXT[],
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast transaction queries
CREATE INDEX idx_transactions_signature ON transactions(signature);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_to ON transactions(to_address);
CREATE INDEX idx_transactions_block_time ON transactions(block_time DESC);
CREATE INDEX idx_transactions_flagged ON transactions(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX idx_transactions_amount ON transactions(amount DESC);

-- Risk patterns table (for detected suspicious patterns)
CREATE TABLE risk_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'structuring', 'rapid_movement', 'round_numbers', 'high_velocity'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    related_transactions UUID[] DEFAULT '{}',
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(44)
);

CREATE INDEX idx_risk_patterns_wallet ON risk_patterns(wallet_address);
CREATE INDEX idx_risk_patterns_type ON risk_patterns(pattern_type);
CREATE INDEX idx_risk_patterns_severity ON risk_patterns(severity);
CREATE INDEX idx_risk_patterns_unresolved ON risk_patterns(resolved) WHERE resolved = FALSE;

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    wallet_address VARCHAR(44),
    transaction_id UUID,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_wallet ON alerts(wallet_address);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = FALSE;

-- Known bad actors / OFAC list
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(44) UNIQUE NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'OFAC', 'manual', 'ML_detected'
    reason TEXT NOT NULL,
    added_by VARCHAR(44),
    added_at TIMESTAMP DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'high'
);

CREATE INDEX idx_blacklist_address ON blacklist(address);
CREATE INDEX idx_blacklist_source ON blacklist(source);

-- Protocols (for multi-tenant SaaS)
CREATE TABLE protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_protocols_api_key ON protocols(api_key);

-- API usage tracking
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID REFERENCES protocols(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_requests_protocol ON api_requests(protocol_id);
CREATE INDEX idx_api_requests_created ON api_requests(created_at DESC);

-- Wallet relationships (graph analysis)
CREATE TABLE wallet_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_wallet VARCHAR(44) NOT NULL,
    to_wallet VARCHAR(44) NOT NULL,
    transaction_count INTEGER DEFAULT 1,
    total_volume_sol DECIMAL(20, 9) DEFAULT 0,
    first_interaction TIMESTAMP,
    last_interaction TIMESTAMP,
    relationship_score DECIMAL(5, 2), -- 0-100, how connected they are
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_relationships_from ON wallet_relationships(from_wallet);
CREATE INDEX idx_wallet_relationships_to ON wallet_relationships(to_wallet);
CREATE UNIQUE INDEX idx_wallet_relationships_pair ON wallet_relationships(from_wallet, to_wallet);

-- Views for common queries
CREATE VIEW high_risk_wallets AS
SELECT 
    address,
    risk_score,
    total_transactions,
    total_volume_sol,
    is_blacklisted,
    last_activity
FROM wallets
WHERE risk_score >= 70
ORDER BY risk_score DESC;

CREATE VIEW recent_flagged_transactions AS
SELECT 
    t.signature,
    t.from_address,
    t.to_address,
    t.amount,
    t.block_time,
    t.flag_reasons,
    t.risk_score,
    w_from.risk_score as from_wallet_risk,
    w_to.risk_score as to_wallet_risk
FROM transactions t
LEFT JOIN wallets w_from ON t.from_address = w_from.address
LEFT JOIN wallets w_to ON t.to_address = w_to.address
WHERE t.is_flagged = TRUE
ORDER BY t.block_time DESC
LIMIT 100;

-- Functions for risk calculation
CREATE OR REPLACE FUNCTION calculate_wallet_risk_score(wallet_addr VARCHAR(44))
RETURNS INTEGER AS $$
DECLARE
    velocity_score INTEGER := 0;
    amount_score INTEGER := 0;
    age_score INTEGER := 0;
    blacklist_score INTEGER := 0;
    pattern_score INTEGER := 0;
    final_score INTEGER := 0;
    
    txn_count INTEGER;
    total_vol DECIMAL;
    wallet_age INTEGER;
    is_blacklisted BOOLEAN;
    pattern_count INTEGER;
BEGIN
    -- Get wallet data
    SELECT 
        total_transactions,
        total_volume_sol,
        EXTRACT(DAY FROM (NOW() - first_seen))::INTEGER,
        wallets.is_blacklisted
    INTO txn_count, total_vol, wallet_age, is_blacklisted
    FROM wallets
    WHERE address = wallet_addr;
    
    -- If wallet doesn't exist, return 50 (neutral)
    IF NOT FOUND THEN
        RETURN 50;
    END IF;
    
    -- Velocity score (0-30 points)
    -- High transaction count in short time = suspicious
    IF txn_count > 100 THEN
        velocity_score := 30;
    ELSIF txn_count > 50 THEN
        velocity_score := 20;
    ELSIF txn_count > 20 THEN
        velocity_score := 10;
    END IF;
    
    -- Amount score (0-30 points)
    -- Large volumes = higher risk
    IF total_vol > 1000 THEN
        amount_score := 30;
    ELSIF total_vol > 100 THEN
        amount_score := 20;
    ELSIF total_vol > 10 THEN
        amount_score := 10;
    END IF;
    
    -- Age score (0-20 points)
    -- New wallets = more suspicious
    IF wallet_age < 7 THEN
        age_score := 20;
    ELSIF wallet_age < 30 THEN
        age_score := 10;
    ELSIF wallet_age < 90 THEN
        age_score := 5;
    END IF;
    
    -- Blacklist score (0-20 points)
    IF is_blacklisted THEN
        blacklist_score := 20;
    END IF;
    
    -- Pattern score (check for detected patterns)
    SELECT COUNT(*)
    INTO pattern_count
    FROM risk_patterns
    WHERE wallet_address = wallet_addr
    AND resolved = FALSE;
    
    pattern_score := LEAST(pattern_count * 5, 20);
    
    -- Calculate final score
    final_score := velocity_score + amount_score + age_score + blacklist_score + pattern_score;
    
    -- Ensure score is between 0 and 100
    final_score := LEAST(GREATEST(final_score, 0), 100);
    
    -- Update wallet risk score
    UPDATE wallets
    SET risk_score = final_score,
        updated_at = NOW()
    WHERE address = wallet_addr;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet stats on new transaction
CREATE OR REPLACE FUNCTION update_wallet_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update from_wallet
    INSERT INTO wallets (address, total_transactions, total_volume_sol, last_activity)
    VALUES (NEW.from_address, 1, NEW.amount, NEW.block_time)
    ON CONFLICT (address) DO UPDATE
    SET total_transactions = wallets.total_transactions + 1,
        total_volume_sol = wallets.total_volume_sol + NEW.amount,
        last_activity = NEW.block_time,
        updated_at = NOW();
    
    -- Update to_wallet
    INSERT INTO wallets (address, total_transactions, last_activity)
    VALUES (NEW.to_address, 1, NEW.block_time)
    ON CONFLICT (address) DO UPDATE
    SET total_transactions = wallets.total_transactions + 1,
        last_activity = NEW.block_time,
        updated_at = NOW();
    
    -- Update wallet relationship
    INSERT INTO wallet_relationships (from_wallet, to_wallet, transaction_count, total_volume_sol, first_interaction, last_interaction)
    VALUES (NEW.from_address, NEW.to_address, 1, NEW.amount, NEW.block_time, NEW.block_time)
    ON CONFLICT (from_wallet, to_wallet) DO UPDATE
    SET transaction_count = wallet_relationships.transaction_count + 1,
        total_volume_sol = wallet_relationships.total_volume_sol + NEW.amount,
        last_interaction = NEW.block_time;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_stats
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_stats();

-- Seed some known bad actors (example addresses - replace with real OFAC list)
INSERT INTO blacklist (address, source, reason, severity) VALUES
('GkCCzThfxvxNEY8MrTjqkfcvWM9Y8AKGKV1VVjXUqDru', 'OFAC', 'Sanctioned address', 'critical'),
('BadActor11111111111111111111111111111111111', 'manual', 'Known scammer', 'high');

-- Create admin user (for demo)
INSERT INTO protocols (name, api_key, contact_email, website) VALUES
('Demo Protocol', 'demo_key_' || md5(random()::text), 'demo@example.com', 'https://example.com');
