-- P17.5: Add alert_enabled column to saved_searches
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS alert_enabled boolean NOT NULL DEFAULT false;
