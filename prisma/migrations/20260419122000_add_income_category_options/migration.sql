-- Create table for dynamic income category options
CREATE TABLE "income_category_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_category_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "income_category_options_name_key" ON "income_category_options"("name");
CREATE INDEX "income_category_options_is_active_idx" ON "income_category_options"("is_active");

-- Seed default categories (idempotent)
INSERT INTO "income_category_options" ("id", "name", "is_active", "created_at", "updated_at")
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'PENERIMAAN_BOS', true, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'SPP', true, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'DAFTAR_ULANG', true, NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', 'DONASI', true, NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', 'HIBAH', true, NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', 'LAINNYA', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
