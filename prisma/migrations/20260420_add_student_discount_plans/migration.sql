-- CreateTable
CREATE TABLE "student_discount_plans" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "type" "PaymentType" NOT NULL,
  "discount_amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "months_remaining" INTEGER NOT NULL DEFAULT 0,
  "start_month" INTEGER NOT NULL,
  "start_year" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "student_discount_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_discount_plans_student_id_type_idx" ON "student_discount_plans"("student_id", "type");
CREATE INDEX "student_discount_plans_type_is_active_idx" ON "student_discount_plans"("type", "is_active");
CREATE INDEX "student_discount_plans_is_active_start_year_start_month_idx" ON "student_discount_plans"("is_active", "start_year", "start_month");

-- AddForeignKey
ALTER TABLE "student_discount_plans"
ADD CONSTRAINT "student_discount_plans_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_discount_plans"
ADD CONSTRAINT "student_discount_plans_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
