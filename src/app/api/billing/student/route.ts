import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { Prisma, BillingStatus, PaymentType } from '@prisma/client'

// GET /api/billing/student - Get billings for logged-in student
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can access this' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Get student ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            noTelp: true,
            enrollmentType: true,
            email: true,
          },
        },
      },
    })

    if (!user || !user.studentId || !user.student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: Prisma.BillingWhereInput = {
      studentId: user.studentId,
    }

    if (status) {
      if (status === 'unpaid') {
        where.status = { in: ['BILLED', 'OVERDUE', 'PARTIAL'] as BillingStatus[] }
      } else {
        where.status = status.toUpperCase() as BillingStatus
      }
    }

    if (type) {
      where.type = type.toUpperCase() as PaymentType
    }

    // Get billings
    const billings = await prisma.billing.findMany({
      where,
      include: {
        academicYear: {
          select: {
            year: true,
          },
        },
        payments: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paidAt: true,
            method: true,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    // Transform data in the shape expected by the student pages
    const result = billings.map((billing) => ({
      id: billing.id,
      billNumber: billing.billNumber,
      type: billing.type,
      description: billing.description,
      month: billing.month,
      year: billing.year,
      academicYear: billing.academicYear.year,
      totalAmount: billing.totalAmount,
      paidAmount: billing.paidAmount,
      remainingAmount: billing.totalAmount - billing.paidAmount,
      status: billing.status,
      dueDate: billing.dueDate,
      billDate: billing.billDate,
      isOverdue: billing.status === 'OVERDUE',
      isPaid: billing.status === 'PAID',
      canPay: ['BILLED', 'OVERDUE', 'PARTIAL'].includes(billing.status),
      payments: billing.payments,
    }))

    // Calculate summary
    const unpaidBillings = result.filter((b) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(b.status))
    const summary = {
      totalBillings: result.length,
      unpaidBillings: unpaidBillings.length,
      overdueBillings: result.filter((b) => b.status === 'OVERDUE').length,
      paidBillings: result.filter((b) => b.status === 'PAID').length,
      totalAmount: result.reduce((sum, b) => sum + b.totalAmount, 0),
      paidAmount: result.reduce((sum, b) => sum + b.paidAmount, 0),
      remainingAmount: result
        .filter((b) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(b.status))
        .reduce((sum: number, b) => sum + b.remainingAmount, 0),
    }

    const student = user.student

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.nama,
          nis: student.nisn,
          nisn: student.nisn,
          email: student.email,
          phone: student.noTelp,
          className: student.enrollmentType || '-',
        },
        billings: result,
        summary,
      },
      summary,
    })
  } catch (error) {
    console.error('Get student billing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get billing data', details: errorMessage },
      { status: 500 }
    )
  }
}
