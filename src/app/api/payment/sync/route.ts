import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getMidtransTransactionStatus, normalizeMidtransStatus } from '@/lib/midtrans';
import { appendPaymentAuditEvent, buildPaymentNotes } from '@/lib/payment-audit';
import { getPaymentSuccessMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

function resolveBillingStatus(totalAmount: number, paidAmount: number): 'PAID' | 'PARTIAL' {
  return paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session || !['STUDENT', 'TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const paymentId = body?.paymentId as string | undefined;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        billing: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (session.user.role === 'STUDENT') {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user || user.studentId !== payment.billing.studentId) {
        return NextResponse.json({ error: 'Unauthorized to access this payment' }, { status: 403 });
      }
    }

    if (!payment.externalId || payment.method === 'TUNAI') {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          billingStatus: payment.billing.status,
          synced: false,
          reason: 'Payment method does not require gateway sync',
        },
      });
    }

    const midtransStatus = await getMidtransTransactionStatus(payment.externalId);
    const normalizedStatus = normalizeMidtransStatus(midtransStatus.transactionStatus, midtransStatus.fraudStatus);

    if (
      payment.status === normalizedStatus &&
      (!midtransStatus.transactionId || payment.transactionId === midtransStatus.transactionId)
    ) {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          billingStatus: payment.billing.status,
          synced: true,
          changed: false,
        },
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: normalizedStatus,
          transactionId: midtransStatus.transactionId || payment.transactionId,
          paidAt: normalizedStatus === 'COMPLETED'
            ? (midtransStatus.settlementTime ? new Date(midtransStatus.settlementTime) : (payment.paidAt || new Date()))
            : payment.paidAt,
          notes: buildPaymentNotes(normalizedStatus),
          auditPayload: appendPaymentAuditEvent(payment.auditPayload, {
            source: 'sync',
            status: normalizedStatus,
            message: 'Sinkronisasi status dari Midtrans',
            raw: midtransStatus.raw,
          }),
        },
      });

      let updatedBilling = payment.billing;

      if (normalizedStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
        const newPaidAmount = Math.min(
          payment.billing.totalAmount,
          payment.billing.paidAmount + payment.amount
        );

        updatedBilling = await tx.billing.update({
          where: { id: payment.billingId },
          data: {
            paidAmount: newPaidAmount,
            status: resolveBillingStatus(payment.billing.totalAmount, newPaidAmount),
          },
        });
      }

      return { updatedPayment, updatedBilling };
    });

    if (updated.updatedPayment.status === 'COMPLETED' && payment.status !== 'COMPLETED' && payment.billing.student.noTelp) {
      const phoneNumber = payment.billing.student.noTelp.startsWith('+')
        ? payment.billing.student.noTelp
        : `+62${payment.billing.student.noTelp.replace(/^0/, '')}`;

      const message = getPaymentSuccessMessage({
        studentName: payment.billing.student.nama,
        amount: payment.amount,
        billingType: payment.billing.type,
        paymentMethod: payment.method,
        transactionId: updated.updatedPayment.paymentNumber,
      });

      await sendWhatsAppMessage({
        to: phoneNumber,
        body: message,
        template: 'payment_success',
      }).catch((error) => {
        console.warn('Failed to send payment success WhatsApp notification:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: updated.updatedPayment.id,
        status: updated.updatedPayment.status,
        billingStatus: updated.updatedBilling.status,
        synced: true,
        changed: true,
      },
    });
  } catch (error) {
    console.error('Sync payment status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to sync payment status', details: errorMessage },
      { status: 500 }
    );
  }
}
