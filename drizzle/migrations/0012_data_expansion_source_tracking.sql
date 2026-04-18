-- P10.1: Data expansion pipeline - source tracking columns
-- Adds source provenance and data quality tracking to yacht_models

ALTER TABLE yacht_models
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_confidence INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completeness_score INTEGER;

-- Add completeness_score index for sorting/filtering thin records
CREATE INDEX IF NOT EXISTS idx_yacht_models_completeness ON yacht_models(completeness_score);

-- Add data_source index
CREATE INDEX IF NOT EXISTS idx_yacht_models_data_source ON yacht_models(data_source);

-- Create import_jobs table for tracking import runs
CREATE TABLE IF NOT EXISTS import_jobs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  added INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_source ON import_jobs(source);

-- Backfill completeness scores for existing records
-- This uses a simple heuristic: count non-null core fields
UPDATE yacht_models
SET completeness_score = (
  (CASE WHEN length_overall IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN beam IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN draft IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN displacement IS NOT NULL THEN 7 ELSE 0 END) +
  (CASE WHEN ballast IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN sail_area_main IS NOT NULL THEN 7 ELSE 0 END) +
  (CASE WHEN rig_type IS NOT NULL THEN 4 ELSE 0 END) +
  (CASE WHEN keel_type IS NOT NULL THEN 4 ELSE 0 END) +
  (CASE WHEN hull_material IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN cabins IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN berths IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN heads IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN engine_hp IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN engine_type IS NOT NULL THEN 3 ELSE 0 END) +
  (CASE WHEN fuel_capacity IS NOT NULL THEN 4 ELSE 0 END) +
  (CASE WHEN water_capacity IS NOT NULL THEN 3 ELSE 0 END) +
  (CASE WHEN description IS NOT NULL THEN 5 ELSE 0 END) +
  (CASE WHEN design_notes IS NOT NULL THEN 3 ELSE 0 END) +
  (CASE WHEN source_url IS NOT NULL THEN 2 ELSE 0 END)
)
WHERE completeness_score IS NULL;
