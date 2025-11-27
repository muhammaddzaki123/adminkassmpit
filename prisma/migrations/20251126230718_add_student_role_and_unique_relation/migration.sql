/*
  Warnings:

  - The values [PARENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[student_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudentStatus" ADD VALUE 'PENDING_REGISTRATION';
ALTER TYPE "StudentStatus" ADD VALUE 'AWAITING_REREG';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('TREASURER', 'ADMIN', 'STUDENT', 'HEADMASTER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "spp_payments" ADD COLUMN     "auto_recorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "recorded_at" TIMESTAMP(3),
ADD COLUMN     "tahun_ajaran" TEXT,
ADD COLUMN     "transaction_id" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "academic_year" TEXT,
ADD COLUMN     "approval_status" TEXT DEFAULT 'PENDING',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "enrollment_type" TEXT,
ADD COLUMN     "registration_date" TIMESTAMP(3),
ADD COLUMN     "registration_fee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "registration_paid" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'PENDING_REGISTRATION';

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "template" TEXT,
    "metadata" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");
