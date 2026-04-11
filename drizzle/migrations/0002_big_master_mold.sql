CREATE TABLE IF NOT EXISTS "manufacturer_spotlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"meta_description" varchar(500),
	"history_markdown" text NOT NULL,
	"brand_positioning" text,
	"notable_models" jsonb,
	"milestones" jsonb,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturer_spotlights_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manufacturer_spotlights" ADD CONSTRAINT "manufacturer_spotlights_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_manufacturer_spotlights_manufacturer" ON "manufacturer_spotlights" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_manufacturer_spotlights_slug" ON "manufacturer_spotlights" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_manufacturer_spotlights_published" ON "manufacturer_spotlights" USING btree ("is_published");