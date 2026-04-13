import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeMidtransStatus, verifyMidtransSignature } from '@/lib/midtrans';
import { appendPaymentAuditEvent, buildPaymentNotes } from '@/lib/payment-audit';
import { getPaymentSuccessMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

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

    // Try to find payment by order_id first, then by transaction_id
    let payment = await prisma.payment.findUnique({
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

    if (!payment && isMidtransPayload && body.transaction_id) {
      payment = await prisma.payment.findUnique({
        where: { transactionId: body.transaction_id },
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
    }

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
          ...(isMidtransPayload && body.transaction_id && !payment.transactionId
            ? { transactionId: body.transaction_id }
            : {}),
          paidAt: normalizedStatus === 'COMPLETED'
            ? (paidAt ? new Date(paidAt) : new Date())
            : payment.paidAt,
          notes: buildPaymentNotes(normalizedStatus),
          auditPayload: appendPaymentAuditEvent(payment.auditPayload, {
            source: 'webhook',
            status: normalizedStatus,
            message: body.message ? String(body.message) : 'Webhook Midtrans diterima',
            raw: body,
          }),
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
        if (student.noTelp) {
          const phoneNumber = student.noTelp.startsWith('+')
            ? student.noTelp
            : `+62${student.noTelp.replace(/^0/, '')}`;

          const message = getPaymentSuccessMessage({
            studentName: student.nama,
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
