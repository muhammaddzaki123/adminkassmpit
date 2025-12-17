# 🔌 API IMPLEMENTATION EXAMPLES

Contoh implementasi API untuk sistem billing profesional.

---

## 📋 BILLING API

### 1. Generate Tagihan SPP Bulanan

**Endpoint:** `POST /api/billing/generate`

```typescript
// app/api/billing/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface GenerateBillingRequest {
  month: number          // 1-12
  year: number           // 2024
  classIds?: string[]    // Optional: filter by class
  studentIds?: string[]  // Optional: specific students
}

export async function POST(req: NextRequest) {
  try {
    const { month, year, classIds, studentIds }: GenerateBillingRequest = await req.json()

    // Validate
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    // Get active academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!academicYear) {
      return NextResponse.json(
        { error: 'No active academic year' },
        { status: 400 }
      )
    }

    // Build query
    const where: any = {
      isActive: true,
      academicYearId: academicYear.id,
    }

    if (classIds?.length) {
      where.classId = { in: classIds }
    }

    if (studentIds?.length) {
      where.studentId = { in: studentIds }
    }

    // Get students
    const enrollments = await prisma.studentClass.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
    })

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const enrollment of enrollments) {
      try {
        // Check if billing already exists
        const existing = await prisma.billing.findFirst({
          where: {
            studentId: enrollment.studentId,
            month,
            year,
            type: 'SPP',
            academicYearId: academicYear.id,
          },
        })

        if (existing) {
          skipped++
          continue
        }

        // Generate bill number
        const billNumber = await generateBillNumber(year, month)

        // Calculate due date (10th of the month)
        const dueDate = new Date(year, month - 1, 10)

        // Get SPP amount from class
        const amount = enrollment.class.sppAmount

        // Create billing
        await prisma.billing.create({
          data: {
            billNumber,
            studentId: enrollment.studentId,
            academicYearId: academicYear.id,
            type: 'SPP',
            month,
            year,
            subtotal: amount,
            discount: 0,
            totalAmount: amount,
            paidAmount: 0,
            status: 'BILLED',
            dueDate,
            billDate: new Date(),
            description: `SPP ${getMonthName(month)} ${year} - Kelas ${enrollment.class.name}`,
          },
        })

        created++
      } catch (error) {
        errors.push(`Error for student ${enrollment.student.nama}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created,
        skipped,
        total: enrollments.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    console.error('Generate billing error:', error)
    return NextResponse.json(
      { error: 'Failed to generate billings' },
      { status: 500 }
    )
  }
}

async function generateBillNumber(year: number, month: number): Promise<string> {
  // Get last bill number for this month
  const lastBill = await prisma.billing.findFirst({
    where: {
      billNumber: {
        startsWith: `INV/${year}/${String(month).padStart(2, '0')}/`,
      },
    },
    orderBy: { billNumber: 'desc' },
  })

  let sequence = 1
  if (lastBill) {
    const parts = lastBill.billNumber.split('/')
    sequence = parseInt(parts[3]) + 1
  }

  return `INV/${year}/${String(month).padStart(2, '0')}/${String(sequence).padStart(4, '0')}`
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month - 1]
}
```

---

### 2. List Tagihan Siswa

**Endpoint:** `GET /api/billing/student/:studentId`

```typescript
// app/api/billing/student/[studentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params
    const { searchParams } = new URL(req.url)
    
    const status = searchParams.get('status')
    const academicYearId = searchParams.get('academicYearId')
    const type = searchParams.get('type')

    // Build where clause
    const where: any = {
      studentId,
    }

    if (status) {
      where.status = status
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (type) {
      where.type = type
    }

    // Get billings
    const billings = await prisma.billing.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    // Calculate remaining amount for each billing
    const result = billings.map(billing => ({
      ...billing,
      remainingAmount: billing.totalAmount - billing.paidAmount,
      isOverdue: billing.status === 'OVERDUE',
      isPaid: billing.status === 'PAID',
      canPay: ['BILLED', 'OVERDUE', 'PARTIAL'].includes(billing.status),
    }))

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get student billings error:', error)
    return NextResponse.json(
      { error: 'Failed to get billings' },
      { status: 500 }
    )
  }
}
```

---

### 3. Detail Tagihan

**Endpoint:** `GET /api/billing/:billingId`

```typescript
// app/api/billing/[billingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { billingId: string } }
) {
  try {
    const { billingId } = params

    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: {
        student: {
          include: {
            studentClasses: {
              where: { isActive: true },
              include: {
                class: true,
              },
            },
          },
        },
        academicYear: true,
        payments: {
          include: {
            details: true,
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    })

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      )
    }

    // Calculate additional info
    const result = {
      ...billing,
      remainingAmount: billing.totalAmount - billing.paidAmount,
      paymentHistory: billing.payments,
      currentClass: billing.student.studentClasses[0]?.class?.name,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get billing detail error:', error)
    return NextResponse.json(
      { error: 'Failed to get billing detail' },
      { status: 500 }
    )
  }
}
```

---

## 💳 PAYMENT API

### 4. Create Payment

**Endpoint:** `POST /api/payment/create`

```typescript
// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface CreatePaymentRequest {
  billingId: string
  amount: number
  method: 'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | 'TUNAI'
  notes?: string
}

export async function POST(req: NextRequest) {
  try {
    const { billingId, amount, method, notes }: CreatePaymentRequest = await req.json()

    // Validate
    if (!billingId || !amount || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get billing
    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
    })

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (billing.status === 'PAID') {
      return NextResponse.json(
        { error: 'Billing already paid' },
        { status: 400 }
      )
    }

    // Calculate remaining amount
    const remainingAmount = billing.totalAmount - billing.paidAmount

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance (${remainingAmount})` },
        { status: 400 }
      )
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber()

    // Calculate admin fee (example: 2500 for VA)
    const adminFee = method === 'VIRTUAL_ACCOUNT' ? 2500 : 0
    const totalPaid = amount + adminFee

    // Create payment
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          paymentNumber,
          billingId,
          method,
          amount,
          adminFee,
          totalPaid,
          status: method === 'TUNAI' ? 'COMPLETED' : 'PENDING',
          notes,
          paidAt: method === 'TUNAI' ? new Date() : null,
        },
      })

      // If TUNAI, update billing immediately
      if (method === 'TUNAI') {
        const newPaidAmount = billing.paidAmount + amount
        const newStatus = newPaidAmount >= billing.totalAmount ? 'PAID' : 'PARTIAL'

        await tx.billing.update({
          where: { id: billingId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        })
      }

      // If virtual payment, create VA/QR code here
      // Integration with payment gateway...

      return newPayment
    })

    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

async function generatePaymentNumber(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  const lastPayment = await prisma.payment.findFirst({
    where: {
      paymentNumber: {
        startsWith: `PAY/${year}/${month}/`,
      },
    },
    orderBy: { paymentNumber: 'desc' },
  })

  let sequence = 1
  if (lastPayment) {
    const parts = lastPayment.paymentNumber.split('/')
    sequence = parseInt(parts[3]) + 1
  }

  return `PAY/${year}/${month}/${String(sequence).padStart(4, '0')}`
}
```

---

### 5. Payment Webhook (Payment Gateway Callback)

**Endpoint:** `POST /api/payment/webhook`

```typescript
// app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify webhook signature (example for Xendit)
    const signature = req.headers.get('x-callback-token')
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { external_id, status, paid_amount } = body

    // Find payment by external ID
    const payment = await prisma.payment.findUnique({
      where: { externalId: external_id },
      include: { billing: true },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: status === 'PAID' ? 'COMPLETED' : 'FAILED',
          paidAt: status === 'PAID' ? new Date() : null,
        },
      })

      // If paid, update billing
      if (status === 'PAID') {
        const newPaidAmount = payment.billing.paidAmount + payment.amount
        const newStatus = newPaidAmount >= payment.billing.totalAmount ? 'PAID' : 'PARTIAL'

        await tx.billing.update({
          where: { id: payment.billingId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        })

        // Send notification
        await sendPaymentNotification(payment.billing.studentId, payment)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(signature: string | null, body: any): boolean {
  // Implement your payment gateway's signature verification
  // Example for Xendit:
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
  return signature === webhookToken
}

async function sendPaymentNotification(studentId: string, payment: any) {
  // Send WhatsApp/Email notification
  console.log('Sending notification for payment:', payment.id)
}
```

---

## 📊 REPORTS API

### 6. Laporan Tunggakan

**Endpoint:** `GET /api/reports/tunggakan`

```typescript
// app/api/reports/tunggakan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')
    const classId = searchParams.get('classId')

    const where: any = {
      status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    // Get all unpaid/partial billings
    const billings = await prisma.billing.findMany({
      where,
      include: {
        student: {
          include: {
            studentClasses: {
              where: { isActive: true },
              include: { class: true },
            },
          },
        },
        academicYear: true,
      },
      orderBy: { dueDate: 'asc' },
    })

    // Filter by class if needed
    let filtered = billings
    if (classId) {
      filtered = billings.filter(b => 
        b.student.studentClasses.some(sc => sc.classId === classId)
      )
    }

    // Group by status
    const overdue = filtered.filter(b => b.status === 'OVERDUE')
    const billed = filtered.filter(b => b.status === 'BILLED')
    const partial = filtered.filter(b => b.status === 'PARTIAL')

    // Calculate totals
    const totalTunggakan = filtered.reduce(
      (sum, b) => sum + (b.totalAmount - b.paidAmount),
      0
    )

    // Group by class
    const byClass = filtered.reduce((acc, billing) => {
      const className = billing.student.studentClasses[0]?.class?.name || 'Unknown'
      if (!acc[className]) {
        acc[className] = {
          count: 0,
          amount: 0,
        }
      }
      acc[className].count++
      acc[className].amount += billing.totalAmount - billing.paidAmount
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: filtered.length,
          overdue: overdue.length,
          billed: billed.length,
          partial: partial.length,
          totalAmount: totalTunggakan,
        },
        byClass,
        details: filtered.map(b => ({
          billNumber: b.billNumber,
          studentName: b.student.nama,
          studentNISN: b.student.nisn,
          className: b.student.studentClasses[0]?.class?.name,
          month: b.month,
          year: b.year,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          remainingAmount: b.totalAmount - b.paidAmount,
          status: b.status,
          dueDate: b.dueDate,
          daysOverdue: b.status === 'OVERDUE' 
            ? Math.floor((new Date().getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        })),
      },
    })
  } catch (error) {
    console.error('Tunggakan report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
```

---

### 7. Laporan Pemasukan

**Endpoint:** `GET /api/reports/income`

```typescript
// app/api/reports/income/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day' // day, month, year

    const where: any = {
      status: 'COMPLETED',
    }

    if (startDate) {
      where.paidAt = { ...where.paidAt, gte: new Date(startDate) }
    }

    if (endDate) {
      where.paidAt = { ...where.paidAt, lte: new Date(endDate) }
    }

    // Get all completed payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        billing: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    })

    // Calculate totals
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalAdminFee = payments.reduce((sum, p) => sum + p.adminFee, 0)
    const totalNet = totalIncome + totalAdminFee

    // Group by period
    const grouped = payments.reduce((acc, payment) => {
      const date = new Date(payment.paidAt!)
      let key: string

      if (groupBy === 'year') {
        key = date.getFullYear().toString()
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else {
        key = date.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          count: 0,
          amount: 0,
          adminFee: 0,
          total: 0,
        }
      }

      acc[key].count++
      acc[key].amount += payment.amount
      acc[key].adminFee += payment.adminFee
      acc[key].total += payment.totalPaid

      return acc
    }, {} as Record<string, any>)

    // Group by payment type
    const byType = payments.reduce((acc, payment) => {
      const type = payment.billing.type
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          amount: 0,
        }
      }
      acc[type].count++
      acc[type].amount += payment.amount
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    // Group by payment method
    const byMethod = payments.reduce((acc, payment) => {
      const method = payment.method
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          amount: 0,
        }
      }
      acc[method].count++
      acc[method].amount += payment.amount
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPayments: payments.length,
          totalIncome,
          totalAdminFee,
          totalNet,
        },
        byPeriod: Object.values(grouped),
        byType,
        byMethod,
      },
    })
  } catch (error) {
    console.error('Income report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
```

---

## 🔄 CRON JOBS

### 8. Auto Update Overdue Status

```typescript
// scripts/cron-update-overdue.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateOverdueStatus() {
  console.log('🔄 Updating overdue status...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find billings that are past due date
  const result = await prisma.billing.updateMany({
    where: {
      dueDate: { lt: today },
      status: { in: ['BILLED', 'PARTIAL'] },
    },
    data: {
      status: 'OVERDUE',
    },
  })

  console.log(`✅ Updated ${result.count} billings to OVERDUE`)

  // Send notifications
  const overdues = await prisma.billing.findMany({
    where: {
      status: 'OVERDUE',
      dueDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    },
    include: {
      student: true,
    },
  })

  for (const billing of overdues) {
    // Send WhatsApp reminder
    console.log(`📱 Sending reminder to ${billing.student.nama}`)
    // await sendWhatsAppReminder(billing)
  }

  console.log('🎉 Overdue update completed')
}

updateOverdueStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Setup cron (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/update-overdue",
    "schedule": "0 1 * * *"
  }]
}
```

---

## ✅ TESTING

### Example Test Cases

```typescript
// __tests__/billing.test.ts
import { describe, it, expect } from '@jest/globals'

describe('Billing System', () => {
  it('should generate billing for active students', async () => {
    const response = await fetch('/api/billing/generate', {
      method: 'POST',
      body: JSON.stringify({
        month: 12,
        year: 2024,
      }),
    })
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.created).toBeGreaterThan(0)
  })

  it('should handle partial payment', async () => {
    // Create billing
    // Pay partial amount
    // Check status is PARTIAL
    // Pay remaining
    // Check status is PAID
  })

  it('should update to OVERDUE after due date', async () => {
    // Create billing with past due date
    // Run cron
    // Check status is OVERDUE
  })
})
```

---

**Last Updated:** 17 Desember 2024  
**Status:** Ready for implementation  
**Next:** Deploy and test
