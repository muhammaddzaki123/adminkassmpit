import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(request);

    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only treasurer or admin can view payment details' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        billing: {
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
          },
        },
        details: true,
        processedBy: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          paymentNumber: payment.paymentNumber,
          externalId: payment.externalId,
          transactionId: payment.transactionId,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          adminFee: payment.adminFee,
          totalPaid: payment.totalPaid,
          vaNumber: payment.vaNumber,
          qrCode: payment.qrCode,
          deeplink: payment.deeplink,
          notes: payment.notes,
          receiptUrl: payment.receiptUrl,
          paidAt: payment.paidAt?.toISOString() || null,
          expiredAt: payment.expiredAt?.toISOString() || null,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          auditPayload: payment.auditPayload,
          billing: {
            id: payment.billing.id,
            billNumber: payment.billing.billNumber,
            type: payment.billing.type,
            status: payment.billing.status,
            totalAmount: payment.billing.totalAmount,
            paidAmount: payment.billing.paidAmount,
            remainingAmount: payment.billing.totalAmount - payment.billing.paidAmount,
            student: {
              id: payment.billing.student.id,
              nama: payment.billing.student.nama,
              nisn: payment.billing.student.nisn,
              email: payment.billing.student.email,
              noTelp: payment.billing.student.noTelp,
              kelas: payment.billing.student.studentClasses?.[0]?.class?.name || '-',
            },
          },
          processedBy: payment.processedBy,
          paymentDetails: payment.details,
        },
      },
    });
  } catch (error) {
    console.error('Payment detail error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to get payment detail', details: errorMessage },
      { status: 500 }
    );
  }
}
