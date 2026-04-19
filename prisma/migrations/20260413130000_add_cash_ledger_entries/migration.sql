-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "cash_ledger_entries" (
    "id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference_number" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_ledger_entries_entry_number_key" ON "cash_ledger_entries"("entry_number");

-- CreateIndex
CREATE INDEX "cash_ledger_entries_date_idx" ON "cash_ledger_entries"("date");

-- CreateIndex
CREATE INDEX "cash_ledger_entries_direction_date_idx" ON "cash_ledger_entries"("direction", "date");

-- CreateIndex
CREATE INDEX "cash_ledger_entries_source_idx" ON "cash_ledger_entries"("source");

-- CreateIndex
CREATE INDEX "cash_ledger_entries_category_idx" ON "cash_ledger_entries"("category");

-- AddForeignKey
ALTER TABLE "cash_ledger_entries"
ADD CONSTRAINT "cash_ledger_entries_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;