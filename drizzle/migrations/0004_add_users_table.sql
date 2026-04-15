CREATE TABLE IF NOT EXISTS "partner_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"dealer_name" varchar(255) NOT NULL,
	"dealer_type" varchar(50) DEFAULT 'dealer' NOT NULL,
	"contact_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"website_url" varchar(500),
	"location_city" varchar(255),
	"location_country" varchar(255),
	"service_area" varchar(500),
	"specializations" jsonb DEFAULT '[]'::jsonb,
	"offer_type" varchar(50) DEFAULT 'new_sales' NOT NULL,
	"offer_title" varchar(500) NOT NULL,
	"offer_description" text,
	"price_range_min" numeric(12, 2),
	"price_range_max" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"validity_start" timestamp with time zone,
	"validity_end" timestamp with time zone,
	"source_confidence" integer DEFAULT 3 NOT NULL,
	"data_source" varchar(255) DEFAULT 'manual' NOT NULL,
	"data_source_url" varchar(500),
	"last_verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revenue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"page" varchar(500) NOT NULL,
	"source" varchar(100) NOT NULL,
	"metadata" jsonb,
	"session_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_offers" ADD CONSTRAINT "partner_offers_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_offers_manufacturer" ON "partner_offers" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_offers_offer_type" ON "partner_offers" USING btree ("offer_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_offers_dealer_type" ON "partner_offers" USING btree ("dealer_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_offers_active" ON "partner_offers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_offers_country" ON "partner_offers" USING btree ("location_country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenue_events_type" ON "revenue_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenue_events_created" ON "revenue_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenue_events_session" ON "revenue_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenue_events_page" ON "revenue_events" USING btree ("page");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");