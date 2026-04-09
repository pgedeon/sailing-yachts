CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"yacht_model_id" integer NOT NULL,
	"url" varchar(1000) NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false,
	"alt_text" varchar(500),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100),
	"founded_year" integer,
	"website_url" varchar(500),
	"description" text,
	"logo_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"confirmed" boolean DEFAULT false,
	"source" varchar(100) DEFAULT 'website',
	"created_at" timestamp DEFAULT now(),
	"confirmed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"yacht_model_id" integer NOT NULL,
	"source" varchar(100),
	"rating" numeric(2, 1),
	"summary" text,
	"full_text" text,
	"review_date" timestamp,
	"author_name" varchar(200),
	"source_url" varchar(500),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"meta_description" varchar(500),
	"intro" text NOT NULL,
	"icon" varchar(50) DEFAULT '🔍',
	"filters" jsonb,
	"max_results" integer DEFAULT 12,
	"category" varchar(100),
	"is_published" boolean DEFAULT false,
	"search_query" varchar(500),
	"search_count" integer DEFAULT 0,
	"last_searched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "search_intents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spec_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50),
	"data_type" varchar(20) NOT NULL,
	"category_group" varchar(100),
	"display_order" integer DEFAULT 0,
	"is_filterable" boolean DEFAULT true,
	"is_sortable" boolean DEFAULT false,
	"is_comparable" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "spec_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spec_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"yacht_model_id" integer NOT NULL,
	"spec_category_id" integer NOT NULL,
	"value_text" text,
	"value_numeric" numeric(12, 4)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "yacht_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"slug" varchar(500),
	"length_overall" numeric(5, 2),
	"beam" numeric(5, 2),
	"draft" numeric(5, 2),
	"displacement" numeric(8, 2),
	"ballast" numeric(8, 2),
	"sail_area_main" numeric(6, 2),
	"rig_type" varchar(100),
	"keel_type" varchar(100),
	"hull_material" varchar(100),
	"cabins" integer,
	"berths" integer,
	"heads" integer,
	"max_occupancy" integer,
	"engine_hp" numeric(6, 2),
	"engine_type" varchar(100),
	"fuel_capacity" numeric(6, 2),
	"water_capacity" numeric(6, 2),
	"design_notes" text,
	"description" text,
	"source_url" varchar(500),
	"source_attribution" text,
	"admin_links" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "yacht_models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_yacht_model_id_yacht_models_id_fk" FOREIGN KEY ("yacht_model_id") REFERENCES "public"."yacht_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_yacht_model_id_yacht_models_id_fk" FOREIGN KEY ("yacht_model_id") REFERENCES "public"."yacht_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spec_values" ADD CONSTRAINT "spec_values_yacht_model_id_yacht_models_id_fk" FOREIGN KEY ("yacht_model_id") REFERENCES "public"."yacht_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spec_values" ADD CONSTRAINT "spec_values_spec_category_id_spec_categories_id_fk" FOREIGN KEY ("spec_category_id") REFERENCES "public"."spec_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "yacht_models" ADD CONSTRAINT "yacht_models_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_images_yacht" ON "images" USING btree ("yacht_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_manufacturers_name" ON "manufacturers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_newsletter_email" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_confirmed" ON "newsletter_subscribers" USING btree ("confirmed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_yacht" ON "reviews" USING btree ("yacht_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_search_intents_slug" ON "search_intents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_intents_published" ON "search_intents" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_intents_search_count" ON "search_intents" USING btree ("search_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_intents_category" ON "search_intents" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_categories_group" ON "spec_categories" USING btree ("category_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_values_yacht" ON "spec_values" USING btree ("yacht_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_values_category" ON "spec_values" USING btree ("spec_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_spec_values_yacht_category" ON "spec_values" USING btree ("yacht_model_id","spec_category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_manufacturer" ON "yacht_models" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_yacht_models_slug" ON "yacht_models" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_length" ON "yacht_models" USING btree ("length_overall");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_displacement" ON "yacht_models" USING btree ("displacement");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_rig" ON "yacht_models" USING btree ("rig_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_yacht_models_keel" ON "yacht_models" USING btree ("keel_type");