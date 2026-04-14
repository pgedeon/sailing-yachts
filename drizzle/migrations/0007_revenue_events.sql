-- Migration: 0007_revenue_events.sql
-- Creates revenue_events table for P8.6 analytics instrumentation

CREATE TABLE IF NOT EXISTS revenue_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  page VARCHAR(500) NOT NULL,
  source VARCHAR(100) NOT NULL,
  metadata JSONB,
  session_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_type ON revenue_events (event_type);
CREATE INDEX IF NOT EXISTS idx_revenue_events_created ON revenue_events (created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_events_session ON revenue_events (session_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_page ON revenue_events (page);
