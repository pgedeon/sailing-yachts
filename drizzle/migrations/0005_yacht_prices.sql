-- P8.1: Price data schema for yacht pricing intelligence
-- Tracks price ranges by condition, source, and historical snapshots

-- Main price data table
CREATE TABLE IF NOT EXISTS yacht_prices (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  price_min NUMERIC(12, 2) NOT NULL,
  price_max NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  condition VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'broker', 'charter')),
  year INTEGER, -- model year or listing year
  source VARCHAR(255) NOT NULL, -- dealer name, marketplace, etc.
  source_type VARCHAR(30) NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'csv_import', 'api_feed', 'partner', 'scraper')),
  source_url VARCHAR(500),
  confidence_score SMALLINT NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  notes TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historical price snapshots for trend tracking
CREATE TABLE IF NOT EXISTS price_snapshots (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  price_min NUMERIC(12, 2) NOT NULL,
  price_max NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  condition VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used', 'broker', 'charter')),
  source_type VARCHAR(30) NOT NULL DEFAULT 'manual',
  confidence_score SMALLINT NOT NULL DEFAULT 50,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_reason VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (snapshot_reason IN ('scheduled', 'price_change', 'new_listing', 'manual')),
  record_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_yacht_prices_yacht_id ON yacht_prices(yacht_model_id);
CREATE INDEX idx_yacht_prices_condition ON yacht_prices(condition);
CREATE INDEX idx_yacht_prices_active ON yacht_prices(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_yacht_prices_effective_date ON yacht_prices(effective_date);
CREATE INDEX idx_yacht_prices_source_type ON yacht_prices(source_type);

CREATE INDEX idx_price_snapshots_yacht_id ON price_snapshots(yacht_model_id);
CREATE INDEX idx_price_snapshots_date ON price_snapshots(snapshot_date);
CREATE INDEX idx_price_snapshots_yacht_date ON price_snapshots(yacht_model_id, snapshot_date DESC);
CREATE INDEX idx_price_snapshots_condition ON price_snapshots(condition);

-- Unique constraint to prevent duplicate price entries for same yacht/condition/source
CREATE UNIQUE INDEX idx_yacht_prices_unique ON yacht_prices(yacht_model_id, condition, source, effective_date);
