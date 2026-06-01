-- P21.2: Data enrichment pipeline tables
CREATE TABLE IF NOT EXISTS enrichment_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  base_url VARCHAR(500) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  rate_limit_ms INTEGER DEFAULT 2000,
  last_run_at TIMESTAMPTZ,
  total_fetched INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrichment_logs (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES enrichment_sources(id) ON DELETE CASCADE,
  yacht_model_id INTEGER REFERENCES yacht_models(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  fields_updated TEXT[],
  old_values JSONB,
  new_values JSONB,
  confidence INTEGER DEFAULT 50,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enrichment_logs_source ON enrichment_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_yacht ON enrichment_logs(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_status ON enrichment_logs(status);
