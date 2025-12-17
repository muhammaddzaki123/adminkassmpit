/*
  Warnings:

  - The values [PAID,UNPAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `academic_year` on the `new_students` table. All the data in the column will be lost.
  - You are about to drop the column `academic_year` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `daftar_ulang_status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `kelas` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `spp_status` on the `students` table. All the data in the column will be lost.
  - Added the required column `academic_year_id` to the `new_students` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('UNBILLED', 'BILLED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'WAIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'KARTU_KREDIT';
ALTER TYPE "PaymentMethod" ADD VALUE 'KARTU_DEBIT';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'REFUNDED');
ALTER TABLE "public"."new_student_transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."spp_payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."students" ALTER COLUMN "daftar_ulang_status" DROP DEFAULT;
ALTER TABLE "public"."students" ALTER COLUMN "spp_status" DROP DEFAULT;
ALTER TABLE "public"."transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "new_student_transactions" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TABLE "spp_payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "new_student_transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "spp_payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentType" ADD VALUE 'UANG_GEDUNG';
ALTER TYPE "PaymentType" ADD VALUE 'KEGIATAN';
ALTER TYPE "PaymentType" ADD VALUE 'EKSTRAKURIKULER';
ALTER TYPE "PaymentType" ADD VALUE 'SERAGAM';
ALTER TYPE "PaymentType" ADD VALUE 'BUKU';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudentStatus" ADD VALUE 'DROPPED_OUT';
ALTER TYPE "StudentStatus" ADD VALUE 'TRANSFERRED';

-- AlterTable
ALTER TABLE "new_students" DROP COLUMN "academic_year",
ADD COLUMN     "academic_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "academic_year",
DROP COLUMN "daftar_ulang_status",
DROP COLUMN "kelas",
DROP COLUMN "spp_status",
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "birth_place" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "graduation_date" TIMESTAMP(3),
ADD COLUMN     "no_telp_orang_tua" TEXT,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "religion" TEXT;

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "spp_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_capacity" INTEGER DEFAULT 40,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "wali_kelas" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "class_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_items" (
    "id" TEXT NOT NULL,
    "billing_template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billings" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BillingStatus" NOT NULL DEFAULT 'BILLED',
    "due_date" TIMESTAMP(3) NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "notes" TEXT,
    "issued_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "billing_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "admin_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_paid" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "va_number" TEXT,
    "qr_code" TEXT,
    "deeplink" TEXT,
    "expired_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "receipt_url" TEXT,
    "notes" TEXT,
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_details" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "academic_years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_grade_key" ON "classes"("name", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_student_id_academic_year_id_key" ON "student_classes"("student_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "billings_bill_number_key" ON "billings"("bill_number");

-- CreateIndex
CREATE INDEX "billings_student_id_academic_year_id_idx" ON "billings"("student_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "billings_status_idx" ON "billings"("status");

-- CreateIndex
CREATE INDEX "billings_due_date_idx" ON "billings"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_id_key" ON "payments"("external_id");

-- CreateIndex
CREATE INDEX "payments_billing_id_idx" ON "payments"("billing_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "new_students" ADD CONSTRAINT "new_students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_templates" ADD CONSTRAINT "billing_templates_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_billing_template_id_fkey" FOREIGN KEY ("billing_template_id") REFERENCES "billing_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
