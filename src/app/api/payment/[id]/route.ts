import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/payment/[id] - Get payment detail by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);

    if (!session || !['STUDENT', 'TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        billing: {
          include: {
            student: {
              select: {
                id: true,
                nama: true,
                nisn: true,
              },
            },
          },
        },
        details: {
          select: {
            id: true,
            description: true,
            amount: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Authorization: students can only view their own payments
    if (session.user.role === 'STUDENT') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { studentId: true },
      });

      if (!user || user.studentId !== payment.billing?.studentId) {
        return NextResponse.json({ error: 'Unauthorized to view this payment' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        externalId: payment.externalId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        adminFee: payment.adminFee,
        totalPaid: payment.totalPaid,
        status: payment.status,
        method: payment.method,
        vaNumber: payment.vaNumber,
        qrCode: payment.qrCode,
        deeplink: payment.deeplink,
        receiptUrl: payment.receiptUrl,
        expiredAt: payment.expiredAt?.toISOString() ?? null,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        notes: payment.notes,
        details: payment.details,
        processedBy: payment.processedBy
          ? { id: payment.processedBy.id, nama: payment.processedBy.nama }
          : null,
        billing: payment.billing
          ? {
              id: payment.billing.id,
              billNumber: payment.billing.billNumber,
              type: payment.billing.type,
              description: payment.billing.description,
              totalAmount: payment.billing.totalAmount,
              paidAmount: payment.billing.paidAmount,
              status: payment.billing.status,
              month: payment.billing.month,
              year: payment.billing.year,
              student: payment.billing.student
                ? {
                    id: payment.billing.student.id,
                    nama: payment.billing.student.nama,
                    nisn: payment.billing.student.nisn,
                  }
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get payment detail error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get payment detail', details: errorMessage },
      { status: 500 }
    );
  }
}
