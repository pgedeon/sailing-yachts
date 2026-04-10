-- Add buying_guide_template_id column to articles table
-- This links articles to buying guide templates for template-based content
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "buying_guide_template_id" varchar(100);
