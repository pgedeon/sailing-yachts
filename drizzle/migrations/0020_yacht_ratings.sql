-- P23.1: Yacht ratings table
CREATE TABLE IF NOT EXISTS yacht_ratings (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_yacht_ratings_yacht ON yacht_ratings(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_yacht_ratings_user ON yacht_ratings(user_id);

-- Prevent duplicate ratings per user (one rating per user per yacht)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_yacht_ratings_user_yacht ON yacht_ratings(yacht_model_id, user_id) WHERE user_id IS NOT NULL;

-- Prevent duplicate ratings per IP for anonymous users (one rating per IP per yacht)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_yacht_ratings_ip_yacht ON yacht_ratings(yacht_model_id, ip_address) WHERE ip_address IS NOT NULL AND user_id IS NULL;
