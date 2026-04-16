-- Alert preferences table (P9.4)
CREATE TABLE IF NOT EXISTS alert_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_preferences_user ON alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_preferences_type ON alert_preferences(alert_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_preferences_unique ON alert_preferences(user_id, alert_type);

-- Alert log table (P9.4)
CREATE TABLE IF NOT EXISTS alert_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL,
  saved_search_id INTEGER,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_status VARCHAR(30),
  unsubscribe_token VARCHAR(128),
  yacht_model_id INTEGER,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_log_user ON alert_log(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_log_type ON alert_log(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_log_sent ON alert_log(sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_log_token ON alert_log(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_alert_log_dedup ON alert_log(user_id, alert_type, yacht_model_id, sent_at);
