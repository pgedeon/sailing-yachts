-- Add attribution columns to leads table
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_type" varchar(50) DEFAULT 'general';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "page_url" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referrer" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_source" varchar(100);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_medium" varchar(100);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(100);
