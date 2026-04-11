-- Add content freshness tracking columns to articles table
-- last_reviewed_at tracks when an article was last editorially reviewed
-- review_status tracks whether review is needed (fresh, due, stale)
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "last_reviewed_at" timestamp without time zone;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "review_status" varchar(20) DEFAULT 'fresh';
