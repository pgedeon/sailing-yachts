ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "image" varchar(500);

ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL;
