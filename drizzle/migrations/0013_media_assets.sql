-- P10.2: Media asset model — support for brochures, deck plans, videos, 360 tours, 3D models
-- Creates a new media_assets table and updates existing schema

-- Create media type enum
CREATE TYPE media_type AS ENUM (
  'photo',
  'brochure',
  'deck_plan',
  'interior_layout',
  'video',
  '360_tour',
  '3d_model'
);

-- Create media_assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  media_type media_type NOT NULL DEFAULT 'photo',
  title VARCHAR(500),
  description TEXT,
  
  -- URL fields
  url VARCHAR(1000),          -- Direct URL to the asset (image, PDF, etc.)
  embed_url VARCHAR(1000),    -- Embed URL for videos/360 tours (YouTube, Vimeo, etc.)
  thumbnail_url VARCHAR(1000),-- Thumbnail for non-photo media
  source_url VARCHAR(1000),   -- Attribution/source URL
  
  -- File metadata
  file_format VARCHAR(50),    -- pdf, jpg, png, mp4, glb, etc.
  file_size INTEGER,          -- Size in bytes
  
  -- Display metadata
  caption TEXT,
  alt_text VARCHAR(500),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Source provenance (consistent with P10.1)
  data_source VARCHAR(100) DEFAULT 'manual',
  source_confidence INTEGER DEFAULT 50,
  last_verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_yacht ON media_assets(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_primary ON media_assets(yacht_model_id) WHERE is_primary = TRUE;

-- Add media_count column to yacht_models for quick lookups
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS media_count INTEGER DEFAULT 0;

-- Backfill media_count from existing images table
UPDATE yacht_models y SET media_count = (
  SELECT COUNT(*) FROM images i WHERE i.yacht_model_id = y.id
);
