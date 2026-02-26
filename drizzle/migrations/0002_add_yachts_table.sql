-- +goose Up
CREATE TABLE IF NOT EXISTS "yachts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text NOT NULL,
	"length_overall" real,
	"beam" real,
	"draft" real,
	"displacement" integer,
	"year" integer,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS "yachts";
