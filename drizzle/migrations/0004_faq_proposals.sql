-- FAQ Proposals table for P7.6: FAQ harvesting pipeline
CREATE TABLE IF NOT EXISTS faq_proposals (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'search', -- 'search', 'compare', 'newsletter', 'manual'
  source_query TEXT, -- original query or compare pair that triggered this proposal
  question TEXT NOT NULL,
  suggested_answer TEXT,
  category VARCHAR(100), -- 'buying', 'specs', 'maintenance', 'comparison', 'general'
  intent_type VARCHAR(50), -- 'informational', 'navigational', 'transactional', 'comparison'
  frequency INTEGER NOT NULL DEFAULT 1, -- how many times this topic appeared
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0, -- calculated priority 0-100
  status VARCHAR(30) NOT NULL DEFAULT 'proposed', -- 'proposed', 'approved', 'published', 'rejected'
  related_yacht_slugs JSONB, -- yacht slugs related to this proposal
  related_article_slugs JSONB, -- existing article slugs that cover similar topics
  matched_search_intent_slug VARCHAR(255), -- matched search intent if any
  admin_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faq_proposals_status ON faq_proposals(status);
CREATE INDEX IF NOT EXISTS idx_faq_proposals_source ON faq_proposals(source);
CREATE INDEX IF NOT EXISTS idx_faq_proposals_priority ON faq_proposals(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_faq_proposals_category ON faq_proposals(category);

-- Compare usage tracking table
CREATE TABLE IF NOT EXISTS compare_usage (
  id SERIAL PRIMARY KEY,
  yacht_slug_a VARCHAR(255) NOT NULL,
  yacht_slug_b VARCHAR(255) NOT NULL,
  compare_count INTEGER NOT NULL DEFAULT 1,
  last_compared_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(yacht_slug_a, yacht_slug_b)
);

CREATE INDEX IF NOT EXISTS idx_compare_usage_count ON compare_usage(compare_count DESC);
