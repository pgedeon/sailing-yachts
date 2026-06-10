-- P25.4: Multilingual content pipeline tables

-- Content translations: stores translated text for any content type
CREATE TABLE IF NOT EXISTS content_translations (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'yacht_description', 'manufacturer_description', 'article', 'guide', 'glossary_term', 'faq'
  content_id INTEGER NOT NULL, -- FK to the relevant table (yacht_models.id, manufacturers.id, articles.id, etc.)
  field_name VARCHAR(100) NOT NULL, -- 'description', 'title', 'content', 'excerpt', etc.
  source_locale VARCHAR(5) NOT NULL DEFAULT 'en',
  target_locale VARCHAR(5) NOT NULL DEFAULT 'fr',
  source_text TEXT,
  translated_text TEXT NOT NULL,
  translation_method VARCHAR(30) NOT NULL DEFAULT 'manual', -- 'manual', 'template', 'memory', 'external'
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'auto_translated', 'in_review', 'approved', 'rejected'
  quality_score INTEGER DEFAULT 50, -- 0-100 confidence/quality score
  reviewer_id INTEGER,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ct_content_type ON content_translations(content_type);
CREATE INDEX IF NOT EXISTS idx_ct_content_id ON content_translations(content_id);
CREATE INDEX IF NOT EXISTS idx_ct_status ON content_translations(status);
CREATE INDEX IF NOT EXISTS idx_ct_locale_pair ON content_translations(source_locale, target_locale);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ct_unique ON content_translations(content_type, content_id, field_name, source_locale, target_locale);
CREATE INDEX IF NOT EXISTS idx_ct_method ON content_translations(translation_method);

-- Translation memory: reusable approved translations for consistency
CREATE TABLE IF NOT EXISTS translation_memory (
  id SERIAL PRIMARY KEY,
  source_locale VARCHAR(5) NOT NULL DEFAULT 'en',
  target_locale VARCHAR(5) NOT NULL DEFAULT 'fr',
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_hash VARCHAR(64) NOT NULL, -- SHA-256 of source_text for fast lookup
  category VARCHAR(100), -- 'nautical', 'spec', 'marketing', 'general'
  match_count INTEGER NOT NULL DEFAULT 1, -- how many times this memory entry was reused
  quality_score INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for translation memory
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_unique ON translation_memory(source_hash, source_locale, target_locale);
CREATE INDEX IF NOT EXISTS idx_tm_category ON translation_memory(category);
CREATE INDEX IF NOT EXISTS idx_tm_source_hash ON translation_memory(source_hash);
