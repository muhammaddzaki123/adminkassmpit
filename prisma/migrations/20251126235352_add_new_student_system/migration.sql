/*
  Warnings:

  - You are about to drop the column `approval_status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `approved_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `registration_date` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `registration_fee` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `registration_paid` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[new_student_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `academic_year` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'NEW_STUDENT';

-- AlterTable
ALTER TABLE "students" DROP COLUMN "approval_status",
DROP COLUMN "approved_at",
DROP COLUMN "approved_by",
DROP COLUMN "registration_date",
DROP COLUMN "registration_fee",
DROP COLUMN "registration_paid",
ADD COLUMN     "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "academic_year" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "new_student_id" TEXT;

-- CreateTable
CREATE TABLE "new_students" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" TIMESTAMP(3),
    "jenis_kelamin" TEXT,
    "agama" TEXT,
    "alamat" TEXT,
    "no_telp" TEXT,
    "email" TEXT,
    "nama_ayah" TEXT,
    "nama_ibu" TEXT,
    "no_telp_ortu" TEXT,
    "pekerjaan_ayah" TEXT,
    "pekerjaan_ibu" TEXT,
    "enrollment_type" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "kelas_yang_dituju" TEXT NOT NULL,
    "asal_sekolah" TEXT,
    "foto_siswa" TEXT,
    "akta_kelahiran" TEXT,
    "kartu_keluarga" TEXT,
    "ijazah_sebelumnya" TEXT,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "registration_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "virtual_account" TEXT,
    "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_student_transactions" (
    "id" TEXT NOT NULL,
    "new_student_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "admin_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "va_number" TEXT,
    "expired_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "description" TEXT,
    "bukti_pembayaran" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_student_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "new_students_nisn_key" ON "new_students"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "new_students_virtual_account_key" ON "new_students"("virtual_account");

-- CreateIndex
CREATE UNIQUE INDEX "new_student_transactions_external_id_key" ON "new_student_transactions"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_new_student_id_key" ON "users"("new_student_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_new_student_id_fkey" FOREIGN KEY ("new_student_id") REFERENCES "new_students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_student_transactions" ADD CONSTRAINT "new_student_transactions_new_student_id_fkey" FOREIGN KEY ("new_student_id") REFERENCES "new_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
