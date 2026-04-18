ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'expert';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_breakdown JSONB DEFAULT '{"build_quality": null, "sailing_performance": null, "comfort": null, "value_for_money": null}'::jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}';
