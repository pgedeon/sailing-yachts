CREATE INDEX IF NOT EXISTS "idx_images_yacht" ON "images" ("yacht_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_manufacturers_name" ON "manufacturers" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_yacht" ON "reviews" ("yacht_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_categories_group" ON "spec_categories" ("category_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_values_yacht" ON "spec_values" ("yacht_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_values_category" ON "spec_values" ("spec_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_spec_values_yacht_category" ON "spec_values" ("yacht_model_id","spec_category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_manufacturer" ON "yacht_models" ("manufacturer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_yacht_models_slug" ON "yacht_models" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_length" ON "yacht_models" ("length_overall");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_displacement" ON "yacht_models" ("displacement");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_rig" ON "yacht_models" ("rig_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_keel" ON "yacht_models" ("keel_type");