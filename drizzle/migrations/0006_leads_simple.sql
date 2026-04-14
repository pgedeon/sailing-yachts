-- P8.3 & P8.4: Leads table for dealer/broker inquiry routing

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  yacht_ids VARCHAR(1000) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'compare_page',
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  metadata JSONB,
  assigned_to VARCHAR(255),
  follow_up_date TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
