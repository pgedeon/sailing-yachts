-- P11.2: Query/index audit — Add missing indexes for hot query paths
-- Issue: #186

-- 1. Enable pg_trgm for fast ILIKE/text search (Neon supports this)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram indexes for search ILIKE queries on yacht_models
-- These replace full table seq scans for ILIKE '%term%' patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_model_name_trgm
  ON yacht_models USING gin (model_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_rig_type_trgm
  ON yacht_models USING gin (rig_type gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_keel_type_trgm
  ON yacht_models USING gin (keel_type gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_hull_material_trgm
  ON yacht_models USING gin (hull_material gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_description_trgm
  ON yacht_models USING gin (description gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_design_notes_trgm
  ON yacht_models USING gin (design_notes gin_trgm_ops);

-- 3. GIN trigram on manufacturers name for search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manufacturers_name_trgm
  ON manufacturers USING gin (name gin_trgm_ops);

-- 4. Missing single-column index for hull_material filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_hull
  ON yacht_models (hull_material);

-- 5. Composite index: manufacturer + length_overall (common filter combo on browse page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_manufacturer_length
  ON yacht_models (manufacturer_id, length_overall);

-- 6. Composite index: manufacturer + created_at (manufacturer detail pages order by date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yacht_models_manufacturer_created
  ON yacht_models (manufacturer_id, created_at DESC, model_name);

-- 7. Composite index: images yacht_model_id + sort_order (image gallery ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_yacht_sort
  ON images (yacht_model_id, sort_order);

-- 8. Composite index: spec_values yacht_model_id + spec_category_id with included columns
-- The unique index already covers (yacht_model_id, spec_category_id) but this adds covering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_spec_values_yacht_category_covering
  ON spec_values (yacht_model_id, spec_category_id)
  INCLUDE (value_text, value_numeric);

-- 9. Composite index for reviews by yacht + date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_yacht_date
  ON reviews (yacht_model_id, review_date);

-- 10. Index for media_assets yacht + sort (ordered gallery retrieval)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_yacht_sort
  ON media_assets (yacht_model_id, sort_order, created_at);
