import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';
import { BillingStatus } from '@prisma/client';

// GET - Get students with payment arrears
export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');

    // Build filter conditions
    const where: {
      status: { in: BillingStatus[] };
      dueDate: { lt: Date };
      academicYearId?: string;
    } = {
      status: {
        in: [BillingStatus.BILLED, BillingStatus.PARTIAL, BillingStatus.OVERDUE]
      },
      dueDate: {
        lt: new Date() // Overdue
      }
    };

    if (academicYear) {
      where.academicYearId = academicYear;
    }

    // Get overdue billings with student info
    const overdueBillings = await prisma.billing.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            noTelp: true
          }
        },
        academicYear: {
          select: {
            year: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { student: { nama: 'asc' } }
      ]
    });

    // Note: classLevel filter removed as it's not in Student model
    const filteredBillings = overdueBillings;

    // Calculate arrears summary
    const summary = {
      totalStudents: new Set(filteredBillings.map(b => b.studentId)).size,
      totalOverdueBillings: filteredBillings.length,
      totalArrears: filteredBillings.reduce((sum, b) => sum + b.totalAmount, 0)
    };

    return NextResponse.json({
      summary,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arrears: filteredBillings.map((b: any) => ({
        billingId: b.id,
        studentId: b.student.id,
        studentName: b.student.nama,
        nisn: b.student.nisn,
        phone: b.student.noTelp,
        billingType: b.type,
        academicYear: b.academicYear.year,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount,
        remainingAmount: b.totalAmount - b.paidAmount,
        dueDate: b.dueDate,
        daysOverdue: Math.floor((Date.now() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        status: b.status
      }))
    });
  } catch (error) {
    console.error('Error fetching arrears report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrears report' },
      { status: 500 }
    );
  }
}
