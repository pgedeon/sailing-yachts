-- P24.1: Analytics events table for user behavior tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  page VARCHAR(500) NOT NULL,
  entity_id INTEGER,
  entity_type VARCHAR(50),
  session_id VARCHAR(100) NOT NULL,
  metadata JSONB,
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  country VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events (page);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events (entity_type, entity_id);
