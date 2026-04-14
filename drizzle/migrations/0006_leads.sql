-- P8.3 & P8.4: Leads table for dealer/broker inquiry routing
-- Captures lead/inquiry submissions from comparison pages and other forms
-- Supports broker assignment, follow-up tracking, and conversion metrics

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  yacht_ids VARCHAR(1000) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'compare_page' CHECK (source IN ('compare_page', 'yacht_detail', 'dealer_form', 'charter_form', 'contact_form')),
  status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'follow_up_scheduled', 'qualified', 'converted', 'lost', 'spam')),
  metadata JSONB,
  assigned_to VARCHAR(255), -- broker/dealer identifier
  follow_up_date TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();
