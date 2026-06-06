-- AB test events tracking table
CREATE TABLE IF NOT EXISTS ab_events (
  id SERIAL PRIMARY KEY,
  experiment_id VARCHAR(100) NOT NULL,
  variant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('impression', 'conversion', 'click')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment ON ab_events (experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment_variant ON ab_events (experiment_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_type ON ab_events (experiment_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ab_events_user ON ab_events (user_id, experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_created ON ab_events (created_at);
