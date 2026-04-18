CREATE TABLE IF NOT EXISTS user_corrections (
  id SERIAL PRIMARY KEY,
  yacht_model_id INTEGER NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  submitter_name TEXT,
  submitter_email TEXT,
  correction_type TEXT NOT NULL DEFAULT 'incorrect_value',
  field_name TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  notes TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_corrections_yacht ON user_corrections(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_corrections_status ON user_corrections(status);
