-- P23.2: Shared comparisons table for persistent sharing URLs
CREATE TABLE IF NOT EXISTS shared_comparisons (
  id SERIAL PRIMARY KEY,
  share_id VARCHAR(12) NOT NULL UNIQUE,
  yacht_ids JSONB NOT NULL,
  title VARCHAR(500),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by share_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_comparisons_share_id ON shared_comparisons(share_id);
-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_shared_comparisons_created_at ON shared_comparisons(created_at);
