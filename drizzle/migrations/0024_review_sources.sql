-- P25.2: Review sources for external review aggregation
CREATE TABLE IF NOT EXISTS review_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(200) NOT NULL UNIQUE,
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  description TEXT,
  credibility_score INTEGER DEFAULT 50,
  source_type VARCHAR(50) NOT NULL DEFAULT 'magazine',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_sources_slug ON review_sources(slug);
CREATE INDEX IF NOT EXISTS idx_review_sources_active ON review_sources(is_active);

-- Add review_source_id FK to existing reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_source_id INTEGER REFERENCES review_sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(review_source_id);
