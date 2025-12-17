# 🚀 MIGRATION GUIDE - Sistem Lama ke Profesional

## 📋 OVERVIEW

Guide ini menjelaskan langkah-langkah migrasi dari sistem lama ke sistem billing profesional.

---

## ⚠️ IMPORTANT: BACKUP DATABASE

```bash
# Backup database sebelum migrasi!
pg_dump -h your-host -U your-user -d your-db > backup_before_migration.sql
```

---

## 📝 CHECKLIST MIGRASI

### ✅ FASE 1: DATABASE SCHEMA
- [ ] Backup database
- [ ] Apply migration (create new tables)
- [ ] Verify migration success
- [ ] Seed initial data

### ✅ FASE 2: DATA MIGRATION
- [ ] Migrate students to StudentClass
- [ ] Create Billing from old SPPPayment
- [ ] Create Payment from old Transaction
- [ ] Verify data integrity

### ✅ FASE 3: API REFACTOR
- [ ] Create new API endpoints
- [ ] Update old endpoints (backward compatible)
- [ ] Test all endpoints
- [ ] Update documentation

### ✅ FASE 4: UI UPDATE
- [ ] Update student dashboard
- [ ] Update treasurer dashboard
- [ ] Update payment flow
- [ ] Update reports

### ✅ FASE 5: DEPRECATION
- [ ] Mark old APIs as deprecated
- [ ] Add migration notices
- [ ] Plan removal timeline
- [ ] Remove old code

---

## 🔧 FASE 1: DATABASE SCHEMA

### Step 1: Apply Migration

```bash
# Generate migration
npx prisma migrate dev --name add_professional_billing_system

# Generate Prisma Client
npx prisma generate
```

### Step 2: Verify Migration

```bash
# Check database tables
npx prisma studio

# Verify tables created:
# - academic_years
# - classes
# - student_classes
# - billing_templates
# - billing_items
# - billings
# - payments
# - payment_details
```

### Step 3: Seed Initial Data

Create file: `prisma/seed-billing-system.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding billing system...')

  // 1. Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      year: '2024/2025',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
      description: 'Tahun Ajaran 2024/2025',
    },
  })
  console.log('✅ Academic Year created:', academicYear.year)

  // 2. Create Classes
  const classes = [
    { name: '7A', grade: 7, sppAmount: 150000 },
    { name: '7B', grade: 7, sppAmount: 150000 },
    { name: '7C', grade: 7, sppAmount: 150000 },
    { name: '8A', grade: 8, sppAmount: 175000 },
    { name: '8B', grade: 8, sppAmount: 175000 },
    { name: '8C', grade: 8, sppAmount: 175000 },
    { name: '9A', grade: 9, sppAmount: 200000 },
    { name: '9B', grade: 9, sppAmount: 200000 },
    { name: '9C', grade: 9, sppAmount: 200000 },
  ]

  for (const cls of classes) {
    await prisma.class.create({
      data: {
        ...cls,
        isActive: true,
        maxCapacity: 40,
      },
    })
  }
  console.log('✅ Classes created:', classes.length)

  // 3. Create Billing Templates
  const templates = [
    {
      name: 'SPP Kelas 7',
      type: 'SPP',
      amount: 150000,
      isRecurring: true,
    },
    {
      name: 'SPP Kelas 8',
      type: 'SPP',
      amount: 175000,
      isRecurring: true,
    },
    {
      name: 'SPP Kelas 9',
      type: 'SPP',
      amount: 200000,
      isRecurring: true,
    },
    {
      name: 'Uang Gedung',
      type: 'UANG_GEDUNG',
      amount: 5000000,
      isRecurring: false,
    },
    {
      name: 'Daftar Ulang',
      type: 'DAFTAR_ULANG',
      amount: 500000,
      isRecurring: false,
    },
  ]

  for (const template of templates) {
    await prisma.billingTemplate.create({
      data: {
        ...template,
        isActive: true,
      },
    })
  }
  console.log('✅ Billing Templates created:', templates.length)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run seed:
```bash
npx ts-node prisma/seed-billing-system.ts
```

---

## 🔄 FASE 2: DATA MIGRATION

### Step 1: Migrate Students to StudentClass

Create file: `scripts/migrate-students-to-class.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateStudentsToClass() {
  console.log('📦 Migrating students to StudentClass...')

  // Get active academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  if (!academicYear) {
    throw new Error('No active academic year found')
  }

  // Get all active students
  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE' },
  })

  for (const student of students) {
    // Parse kelas dari field lama (misal: "7A", "8B")
    const kelasName = student.kelas // Assuming old field exists
    
    // Find matching class
    const kelas = await prisma.class.findFirst({
      where: { name: kelasName },
    })

    if (!kelas) {
      console.warn(`⚠️ Class not found for student ${student.nama}: ${kelasName}`)
      continue
    }

    // Create StudentClass
    await prisma.studentClass.create({
      data: {
        studentId: student.id,
        classId: kelas.id,
        academicYearId: academicYear.id,
        enrollmentDate: student.admissionDate,
        isActive: true,
      },
    })

    console.log(`✅ Migrated: ${student.nama} → ${kelasName}`)
  }

  console.log('🎉 Migration completed!')
}

migrateStudentsToClass()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run:
```bash
npx ts-node scripts/migrate-students-to-class.ts
```

### Step 2: Migrate SPPPayment to Billing + Payment

Create file: `scripts/migrate-spp-to-billing.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSPPToBilling() {
  console.log('📦 Migrating SPPPayment to Billing + Payment...')

  // Get active academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  if (!academicYear) {
    throw new Error('No active academic year found')
  }

  // Get all paid SPP payments
  const sppPayments = await prisma.sPPPayment.findMany({
    where: { status: 'PAID' },
    include: { student: true },
  })

  let counter = 1

  for (const spp of sppPayments) {
    // Generate bill number
    const billNumber = `INV/MIG/${spp.year}/${String(counter).padStart(4, '0')}`

    // Create Billing
    const billing = await prisma.billing.create({
      data: {
        billNumber,
        studentId: spp.studentId,
        academicYearId: academicYear.id,
        type: 'SPP',
        month: spp.month || 1,
        year: spp.year || 2024,
        subtotal: spp.amount,
        discount: 0,
        totalAmount: spp.amount,
        paidAmount: spp.amount,
        status: 'PAID',
        dueDate: spp.paidAt || new Date(),
        billDate: spp.createdAt,
      },
    })

    // Generate payment number
    const paymentNumber = `PAY/MIG/${spp.year}/${String(counter).padStart(4, '0')}`

    // Create Payment
    await prisma.payment.create({
      data: {
        paymentNumber,
        billingId: billing.id,
        method: spp.paymentMethod || 'TUNAI',
        amount: spp.amount,
        adminFee: 0,
        totalPaid: spp.amount,
        status: 'COMPLETED',
        paidAt: spp.paidAt,
        receiptUrl: spp.buktiTransfer,
      },
    })

    console.log(`✅ Migrated: ${spp.student.nama} - ${billNumber}`)
    counter++
  }

  console.log('🎉 Migration completed!', counter - 1, 'records')
}

migrateSPPToBilling()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run:
```bash
npx ts-node scripts/migrate-spp-to-billing.ts
```

### Step 3: Verify Data Integrity

```typescript
// Check script: scripts/verify-migration.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Verifying migration...')

  // Count records
  const studentCount = await prisma.student.count()
  const studentClassCount = await prisma.studentClass.count()
  const billingCount = await prisma.billing.count()
  const paymentCount = await prisma.payment.count()

  console.log('📊 Statistics:')
  console.log('  Students:', studentCount)
  console.log('  StudentClasses:', studentClassCount)
  console.log('  Billings:', billingCount)
  console.log('  Payments:', paymentCount)

  // Check orphaned records
  const studentsWithoutClass = await prisma.student.findMany({
    where: {
      status: 'ACTIVE',
      studentClasses: { none: {} },
    },
  })

  if (studentsWithoutClass.length > 0) {
    console.warn('⚠️ Students without class:', studentsWithoutClass.length)
  } else {
    console.log('✅ All students have classes')
  }

  // Check billing integrity
  const billingsWithoutPayment = await prisma.billing.findMany({
    where: {
      status: 'PAID',
      payments: { none: {} },
    },
  })

  if (billingsWithoutPayment.length > 0) {
    console.warn('⚠️ Paid billings without payment:', billingsWithoutPayment.length)
  } else {
    console.log('✅ All paid billings have payments')
  }

  console.log('🎉 Verification completed!')
}

verifyMigration()
  .catch((e) => {
    console.error('❌ Verification failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 🔌 FASE 3: API REFACTOR

### Step 1: Create New API Endpoints

```typescript
// app/api/billing/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { month, year, classIds } = await req.json()

    // Get active academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    // Get students in specified classes
    const students = await prisma.studentClass.findMany({
      where: {
        classId: { in: classIds },
        isActive: true,
        academicYearId: academicYear.id,
      },
      include: {
        student: true,
        class: true,
      },
    })

    let counter = 0

    for (const enrollment of students) {
      // Check if billing already exists
      const existing = await prisma.billing.findFirst({
        where: {
          studentId: enrollment.studentId,
          month,
          year,
          type: 'SPP',
        },
      })

      if (existing) continue

      // Generate bill number
      const billNumber = `INV/${year}/${String(month).padStart(2, '0')}/${String(counter + 1).padStart(4, '0')}`

      // Calculate due date (10th of the month)
      const dueDate = new Date(year, month - 1, 10)

      // Create billing
      await prisma.billing.create({
        data: {
          billNumber,
          studentId: enrollment.studentId,
          academicYearId: academicYear.id,
          type: 'SPP',
          month,
          year,
          subtotal: enrollment.class.sppAmount,
          discount: 0,
          totalAmount: enrollment.class.sppAmount,
          paidAmount: 0,
          status: 'BILLED',
          dueDate,
          billDate: new Date(),
          description: `SPP ${getMonthName(month)} ${year}`,
        },
      })

      counter++
    }

    return NextResponse.json({
      success: true,
      message: `${counter} tagihan berhasil dibuat`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate billings' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month - 1]
}
```

More endpoints dalam folder: `app/api/billing/`, `app/api/payment/`, `app/api/reports/`

### Step 2: Update Old Endpoints (Backward Compatible)

```typescript
// app/api/spp-payments/route.ts
// Add deprecation notice
export async function GET(req: NextRequest) {
  console.warn('⚠️ DEPRECATED: Use /api/billing/list instead')
  
  // Still works but returns data from new schema
  const billings = await prisma.billing.findMany({
    where: { type: 'SPP' },
    include: { student: true, payments: true },
  })

  // Transform to old format for backward compatibility
  const oldFormat = billings.map(b => ({
    id: b.id,
    studentId: b.studentId,
    bulan: `${getMonthName(b.month!)} ${b.year}`,
    nominal: b.totalAmount,
    status: b.status === 'PAID' ? 'PAID' : 'UNPAID',
    tanggalBayar: b.payments[0]?.paidAt,
  }))

  return NextResponse.json(oldFormat)
}
```

---

## 🎨 FASE 4: UI UPDATE

### Student Dashboard

```typescript
// app/student/dashboard/page.tsx
export default async function StudentDashboard() {
  const user = await getUser()
  
  // Get unpaid/overdue billings
  const billings = await prisma.billing.findMany({
    where: {
      studentId: user.studentId,
      status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    },
    orderBy: { dueDate: 'asc' },
  })

  return (
    <div>
      <h1>Tagihan SPP</h1>
      
      {/* Show overdue billings */}
      {billings.filter(b => b.status === 'OVERDUE').length > 0 && (
        <Alert variant="danger">
          ⚠️ Anda memiliki {billings.filter(b => b.status === 'OVERDUE').length} tagihan yang menunggak
        </Alert>
      )}

      {/* List billings */}
      <div className="space-y-4">
        {billings.map(billing => (
          <BillingCard key={billing.id} billing={billing} />
        ))}
      </div>
    </div>
  )
}
```

### Treasurer Dashboard

```typescript
// app/treasurer/dashboard/page.tsx
export default async function TreasurerDashboard() {
  // Get statistics
  const stats = await prisma.billing.groupBy({
    by: ['status'],
    _count: true,
    _sum: { totalAmount: true, paidAmount: true },
  })

  const overdueCount = stats.find(s => s.status === 'OVERDUE')?._count || 0
  const overdueAmount = stats.find(s => s.status === 'OVERDUE')?._sum.totalAmount || 0

  return (
    <div>
      <h1>Dashboard Bendahara</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Tunggakan"
          value={overdueCount}
          subtitle={`Rp ${overdueAmount.toLocaleString()}`}
          variant="danger"
        />
        {/* More stats... */}
      </div>

      {/* List overdue students */}
      <OverdueStudentsList />
    </div>
  )
}
```

---

## 🗑️ FASE 5: DEPRECATION & CLEANUP

### Step 1: Mark Old Models as Deprecated

Already done in schema with comments:
```prisma
// @DEPRECATED: Gunakan Billing + Payment yang baru
model SPPPayment { ... }
```

### Step 2: Create Deprecation Timeline

```
📅 TIMELINE:

Week 1-2:  Apply migration, seed data
Week 3-4:  Migrate existing data
Week 5-6:  Refactor APIs (backward compatible)
Week 7-8:  Update UI
Week 9-10: Testing & bug fixes
Week 11:   Mark old APIs as deprecated
Week 12:   Monitor usage, prepare removal
Week 13+:  Remove old code (if usage = 0)
```

### Step 3: Remove Old Code (When Ready)

```prisma
// Remove from schema.prisma:
// - model SPPPayment
// - model Transaction (old one)
```

```bash
# Create migration to drop old tables
npx prisma migrate dev --name remove_deprecated_models
```

---

## ✅ VERIFICATION CHECKLIST

Before going to production:

- [ ] All data migrated successfully
- [ ] No data loss
- [ ] New APIs working
- [ ] Old APIs still working (backward compatible)
- [ ] UI updated
- [ ] Reports accurate
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] User acceptance testing passed
- [ ] Documentation updated
- [ ] Team trained

---

## 🆘 TROUBLESHOOTING

### Issue: Migration fails

```bash
# Rollback migration
npx prisma migrate reset

# Restore from backup
psql -h your-host -U your-user -d your-db < backup_before_migration.sql
```

### Issue: Data inconsistency

```bash
# Run verification script
npx ts-node scripts/verify-migration.ts

# Fix issues manually or re-run migration scripts
```

### Issue: Performance slow

```sql
-- Add indexes
CREATE INDEX idx_billing_student_status ON billings(student_id, status);
CREATE INDEX idx_billing_due_date ON billings(due_date) WHERE status != 'PAID';
CREATE INDEX idx_payment_billing ON payments(billing_id);
```

---

## 📞 SUPPORT

Jika ada masalah saat migrasi:
1. Check logs di `logs/migration.log`
2. Run verification script
3. Check documentation
4. Contact tech lead

---

**Last Updated:** 17 Desember 2024  
**Version:** 1.0.0
