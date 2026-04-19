-- Make expense category dynamic and description optional
ALTER TABLE "expenses"
ALTER COLUMN "category" TYPE TEXT USING "category"::text;

ALTER TABLE "expenses"
ALTER COLUMN "description" DROP NOT NULL;

-- Make cash ledger description optional
ALTER TABLE "cash_ledger_entries"
ALTER COLUMN "description" DROP NOT NULL;

-- Create table for dynamic expense category options
CREATE TABLE "expense_category_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_category_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_category_options_name_key" ON "expense_category_options"("name");
CREATE INDEX "expense_category_options_is_active_idx" ON "expense_category_options"("is_active");

-- Seed default categories (idempotent)
INSERT INTO "expense_category_options" ("id", "name", "is_active", "created_at", "updated_at")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'GAJI', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'ATK', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'UTILITAS', true, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'PEMELIHARAAN', true, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'OPERASIONAL', true, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'LAINNYA', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
