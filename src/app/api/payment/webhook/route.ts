import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/notification';
import { normalizeMidtransStatus, verifyMidtransSignature } from '@/lib/midtrans';

function normalizeLegacyStatus(status: string): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' {
  const value = status.toUpperCase();
  if (value === 'PAID' || value === 'SUCCESS') return 'COMPLETED';
  if (value === 'FAILED') return 'FAILED';
  if (value === 'EXPIRED') return 'EXPIRED';
  if (value === 'PROCESSING') return 'PROCESSING';
  return 'PENDING';
}

function resolveBillingStatus(totalAmount: number, paidAmount: number): 'PAID' | 'PARTIAL' {
  return paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const isMidtransPayload = typeof body?.order_id === 'string' && typeof body?.transaction_status === 'string';
    const legacySecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!isMidtransPayload && legacySecret) {
      const incomingSecret = request.headers.get('x-webhook-secret');
      if (!incomingSecret || incomingSecret !== legacySecret) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    if (isMidtransPayload) {
      const isValidSignature = verifyMidtransSignature({
        orderId: body.order_id,
        statusCode: body.status_code,
        grossAmount: body.gross_amount,
        signatureKey: body.signature_key,
      });

      if (!isValidSignature) {
        return NextResponse.json(
          { success: false, error: 'Invalid Midtrans signature' },
          { status: 401 }
        );
      }
    }

    const externalId = isMidtransPayload
      ? (body.order_id as string | undefined)
      : (body.externalId as string | undefined);
    const rawStatus = isMidtransPayload
      ? (body.transaction_status as string | undefined)
      : (body.status as string | undefined);
    const paidAt = (body.settlement_time as string | undefined) || (body.paidAt as string | undefined);

    if (!externalId || !rawStatus) {
      return NextResponse.json(
        { success: false, error: 'externalId and status are required' },
        { status: 400 }
      );
    }

    const normalizedStatus = isMidtransPayload
      ? normalizeMidtransStatus(rawStatus, body.fraud_status as string | undefined)
      : normalizeLegacyStatus(rawStatus);

    const payment = await prisma.payment.findUnique({
      where: { externalId },
      include: {
        billing: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
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

    if (payment.status === 'COMPLETED' && normalizedStatus !== 'REFUNDED') {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          status: payment.status,
          idempotent: true,
        },
      });
    }

    const isTerminal = ['COMPLETED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(payment.status);
    if (isTerminal && payment.status === normalizedStatus) {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          status: payment.status,
          idempotent: true,
        },
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: normalizedStatus,
          paidAt: normalizedStatus === 'COMPLETED'
            ? (paidAt ? new Date(paidAt) : new Date())
            : payment.paidAt,
          notes: body.message
            ? `${payment.notes ? `${payment.notes}\n` : ''}Webhook: ${String(body.message)}`
            : `${payment.notes ? `${payment.notes}\n` : ''}${isMidtransPayload ? `Midtrans: ${JSON.stringify(body)}` : ''}`.trim() || payment.notes,
        },
      });

      let updatedBilling = null;
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

    if (updated.updatedPayment.status === 'COMPLETED') {
      const student = payment.billing.student;
      if (student && (student.email || student.noTelp)) {
        await sendNotification(
          {
            email: student.email || undefined,
            phone: student.noTelp || undefined,
            userId: student.user?.id,
          },
          'payment-success',
          {
            nama: student.nama,
            paymentType: payment.billing.type,
            amount: payment.amount,
            paidAt: updated.updatedPayment.paidAt?.toLocaleString('id-ID') || new Date().toLocaleString('id-ID'),
            transactionId: updated.updatedPayment.paymentNumber,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: updated.updatedPayment.id,
        paymentNumber: updated.updatedPayment.paymentNumber,
        status: updated.updatedPayment.status,
        billingStatus: updated.updatedBilling?.status || payment.billing.status,
      },
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
