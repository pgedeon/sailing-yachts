-- +goose Up
CREATE TABLE IF NOT EXISTS manufacturers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  country TEXT,
  founded_year INT,
  website_url TEXT,
  logo_url TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS yacht_models (
  id SERIAL PRIMARY KEY,
  model_name TEXT,
  manufacturer_id INT REFERENCES manufacturers(id) ON DELETE SET NULL,
  year INT,
  slug TEXT UNIQUE,
  length_overall NUMERIC,
  beam NUMERIC,
  draft NUMERIC,
  displacement NUMERIC,
  ballast NUMERIC,
  sail_area_main NUMERIC,
  rig_type TEXT,
  keel_type TEXT,
  hull_material TEXT,
  cabins INT,
  berths INT,
  heads INT,
  max_occupancy INT,
  engine_hp NUMERIC,
  engine_type TEXT,
  fuel_capacity NUMERIC,
  water_capacity NUMERIC,
  design_notes TEXT,
  description TEXT,
  source_url TEXT,
  source_attribution TEXT,
  admin_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spec_categories (
  id SERIAL PRIMARY KEY,
  name TEXT,
  data_type TEXT,
  unit TEXT,
  description TEXT,
  category_group TEXT,
  is_filterable BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS spec_values (
  id SERIAL PRIMARY KEY,
  yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
  spec_category_id INT REFERENCES spec_categories(id) ON DELETE CASCADE,
  value_text TEXT,
  value_numeric NUMERIC
);

CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
  url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  yacht_model_id INT REFERENCES yacht_models(id) ON DELETE CASCADE,
  source TEXT,
  rating NUMERIC,
  summary TEXT,
  full_text TEXT,
  review_date TIMESTAMPTZ,
  author_name TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='slug') THEN
    ALTER TABLE yacht_models ADD COLUMN slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='updated_at') THEN
    ALTER TABLE yacht_models ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='source_url') THEN
    ALTER TABLE yacht_models ADD COLUMN source_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='source_attribution') THEN
    ALTER TABLE yacht_models ADD COLUMN source_attribution TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='admin_links') THEN
    ALTER TABLE yacht_models ADD COLUMN admin_links JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='yacht_models' AND column_name='created_at') THEN
    ALTER TABLE yacht_models ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Ensure indexes exist (optional performance)
CREATE INDEX IF NOT EXISTS idx_yacht_models_manufacturer ON yacht_models(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_yacht_models_slug ON yacht_models(slug);
CREATE INDEX IF NOT EXISTS idx_yacht_models_length ON yacht_models(length_overall);
CREATE INDEX IF NOT EXISTS idx_yacht_models_displacement ON yacht_models(displacement);
CREATE INDEX IF NOT EXISTS idx_yacht_models_rig ON yacht_models(rig_type);
CREATE INDEX IF NOT EXISTS idx_yacht_models_keel ON yacht_models(keel_type);

-- +goose Down
-- Note: Down migration not provided as this is schema establishment; dropping tables would lose data.
