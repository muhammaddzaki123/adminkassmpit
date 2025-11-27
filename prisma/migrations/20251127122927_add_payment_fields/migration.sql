/*
  Warnings:

  - Added the required column `amount` to the `spp_payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "spp_payments" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_type" TEXT NOT NULL DEFAULT 'SPP',
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "bulan" DROP NOT NULL,
ALTER COLUMN "nominal" DROP NOT NULL;
