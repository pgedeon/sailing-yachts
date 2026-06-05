-- P23.5: Featured yachts (Yacht of the Week)
CREATE TABLE IF NOT EXISTS featured_yachts (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  headline VARCHAR(500),
  editorial_text TEXT,
  newsletter_sent BOOLEAN NOT NULL DEFAULT FALSE,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_yachts_yacht ON featured_yachts(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_featured_yachts_week_start ON featured_yachts(week_start);
CREATE INDEX IF NOT EXISTS idx_featured_yachts_week_end ON featured_yachts(week_end);
CREATE INDEX IF NOT EXISTS idx_featured_yachts_active ON featured_yachts(is_active);
