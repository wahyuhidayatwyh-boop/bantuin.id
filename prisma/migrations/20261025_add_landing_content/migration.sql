-- Konten ulasan dan logo beranda dikelola melalui database, dengan pencatat admin pembuat.
CREATE TABLE IF NOT EXISTS "landing_reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "company" TEXT,
  "quote" TEXT NOT NULL,
  "avatar_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "landing_partner_logos" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "logo_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_landing_reviews_active_created" ON "landing_reviews" ("is_active", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_landing_partner_logos_active_created" ON "landing_partner_logos" ("is_active", "created_at" DESC);
