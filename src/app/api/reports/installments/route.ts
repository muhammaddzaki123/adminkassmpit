import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';

// GET - Get installment payments report
export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');
    const status = searchParams.get('status'); // 'paid', 'unpaid', 'overdue'

    // Build filter for billings with installments
    const where: {
      allowInstallments: boolean;
      academicYearId?: string;
    } = {
      allowInstallments: true
    };

    if (academicYear) {
      where.academicYearId = academicYear;
    }

    // Get billings with installments
    const billings = await prisma.billing.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true
          }
        },
        academicYear: {
          select: {
            year: true
          }
        },
        installments: {
          orderBy: { installmentNo: 'asc' }
        }
      }
    });

    // Process and filter installments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const installmentData = (billings as any[]).flatMap((billing: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      billing.installments.map((inst: any) => ({
        billingId: billing.id,
        billingType: billing.type,
        academicYear: billing.academicYear.year,
        studentId: billing.student.id,
        studentName: billing.student.nama,
        nisn: billing.student.nisn,
        installmentNo: inst.installmentNo,
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        dueDate: inst.dueDate,
        paidAt: inst.paidAt,
        isPaid: inst.isPaid,
        isOverdue: !inst.isPaid && inst.dueDate < new Date(),
        notes: inst.notes
      }))
    );

    // Apply status filter
    let filteredData = installmentData;
    if (status === 'paid') {
      filteredData = installmentData.filter(i => i.isPaid);
    } else if (status === 'unpaid') {
      filteredData = installmentData.filter(i => !i.isPaid && !i.isOverdue);
    } else if (status === 'overdue') {
      filteredData = installmentData.filter(i => i.isOverdue);
    }

    // Calculate summary
    const summary = {
      totalInstallments: filteredData.length,
      totalPaid: filteredData.filter(i => i.isPaid).length,
      totalUnpaid: filteredData.filter(i => !i.isPaid).length,
      totalOverdue: filteredData.filter(i => i.isOverdue).length,
      totalAmount: filteredData.reduce((sum, i) => sum + i.amount, 0),
      totalPaidAmount: filteredData.reduce((sum, i) => sum + i.paidAmount, 0),
      totalRemainingAmount: filteredData.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0)
    };

    return NextResponse.json({
      summary,
      installments: filteredData
    });
  } catch (error) {
    console.error('Error fetching installments report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installments report' },
      { status: 500 }
    );
  }
}
