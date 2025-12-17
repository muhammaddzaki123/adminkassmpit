import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';
import { BillingStatus } from '@prisma/client';

// GET - Get discounts and waivers report
export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');
    const type = searchParams.get('type'); // 'discount', 'waiver', 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build base filter
    const where: {
      OR: Array<{ discount?: { gt: number }; status?: BillingStatus }>;
      academicYearId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      OR: [
        { discount: { gt: 0 } },
        { status: BillingStatus.WAIVED }
      ]
    };

    if (academicYear) {
      where.academicYearId = academicYear;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get billings with discounts or waivers
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discountData = (billings as any[]).filter(b => b.discount > 0).map((b: any) => ({
      billingId: b.id,
      type: 'DISCOUNT' as const,
      studentId: b.student.id,
      studentName: b.student.nama,
      nisn: b.student.nisn,
      billingType: b.type,
      academicYear: b.academicYear.year,
      originalAmount: b.totalAmount + b.discount,
      discountAmount: b.discount,
      finalAmount: b.totalAmount,
      reason: b.discountReason,
      appliedAt: b.updatedAt
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const waiverData = (billings as any[])
      .filter(b => b.status === 'WAIVED')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => ({
        billingId: b.id,
        type: 'WAIVER' as const,
        studentId: b.student.id,
        studentName: b.student.nama,
        nisn: b.student.nisn,
        billingType: b.type,
        academicYear: b.academicYear.year,
        originalAmount: b.totalAmount,
        waivedAmount: b.totalAmount,
        reason: b.waivedReason,
        waivedBy: b.waivedBy,
        appliedAt: b.waivedAt
      }));

    // Filter by type if specified
    type CombinedRecord = {
      billingId: string;
      type: 'DISCOUNT' | 'WAIVER';
      [key: string]: unknown;
    };
    let combinedData: CombinedRecord[] = [];
    if (type === 'discount') {
      combinedData = discountData;
    } else if (type === 'waiver') {
      combinedData = waiverData;
    } else {
      combinedData = [...discountData, ...waiverData].sort(
        (a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime()
      );
    }

    // Calculate summary
    const summary = {
      totalRecords: combinedData.length,
      totalDiscounts: discountData.length,
      totalWaivers: waiverData.length,
      totalDiscountAmount: discountData.reduce((sum, d) => sum + d.discountAmount, 0),
      totalWaivedAmount: waiverData.reduce((sum, w) => sum + w.waivedAmount, 0),
      totalReductionAmount: 
        discountData.reduce((sum, d) => sum + d.discountAmount, 0) +
        waiverData.reduce((sum, w) => sum + w.waivedAmount, 0)
    };

    return NextResponse.json({
      summary,
      records: combinedData
    });
  } catch (error) {
    console.error('Error fetching discounts report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts report' },
      { status: 500 }
    );
  }
}
