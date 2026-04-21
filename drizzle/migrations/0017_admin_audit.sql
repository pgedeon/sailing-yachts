-- P11.8: Admin hardening — audit logs table
-- Tracks all admin mutations for security review and compliance.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,          -- e.g. 'create', 'update', 'delete', 'login', 'logout'
  resource_type VARCHAR(100) NOT NULL,    -- e.g. 'yacht', 'manufacturer', 'review'
  resource_id VARCHAR(100),               -- ID of the affected resource
  details JSONB,                          -- optional: changed fields, old/new values
  ip_address VARCHAR(45),                 -- IPv6-compatible
  user_agent VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON admin_audit_log(user_id, created_at DESC);

-- Login attempts tracking for brute-force protection
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(255),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON admin_login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON admin_login_attempts(email, created_at DESC);

-- Auto-cleanup: keep audit logs for 90 days, login attempts for 30 days
-- (Run via periodic cleanup, not a DB policy)
