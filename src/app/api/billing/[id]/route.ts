import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/billing/[id] - Treasurer/Admin view billing detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);

    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only treasurer or admin can view billing detail' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const billing = await prisma.billing.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            studentClasses: {
              where: { isActive: true },
              include: { class: true },
              take: 1,
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!billing) {
      return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: billing.id,
        billNumber: billing.billNumber,
        type: billing.type,
        month: billing.month,
        year: billing.year,
        description: billing.description,
        totalAmount: billing.totalAmount,
        paidAmount: billing.paidAmount,
        remainingAmount: billing.totalAmount - billing.paidAmount,
        status: billing.status,
        dueDate: billing.dueDate,
        discount: billing.discount,
        discountReason: billing.discountReason,
        allowInstallments: billing.allowInstallments,
        installmentCount: billing.installmentCount,
        installmentAmount: billing.installmentAmount,
        waivedAt: billing.waivedAt,
        waivedReason: billing.waivedReason,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
        student: {
          id: billing.student?.id || '',
          nama: billing.student?.nama || '-',
          nisn: billing.student?.nisn || '-',
          className: billing.student?.studentClasses?.[0]?.class?.name || '-',
        },
        payments: (billing.payments || []).map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt,
          notes: payment.notes,
          createdAt: payment.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get billing detail error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get billing detail', details: errorMessage },
      { status: 500 }
    );
  }
}
