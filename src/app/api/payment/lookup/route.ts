import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payment/lookup?transactionId=xxx or ?externalId=xxx
// Lookup pembayaran berdasarkan transaction_id atau order_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const externalId = searchParams.get('externalId');

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { error: 'transactionId atau externalId harus diisi' },
        { status: 400 }
      );
    }

    const where = {
      OR: [
        ...(transactionId ? [{ transactionId }] : []),
        ...(externalId ? [{ externalId }] : []),
      ],
    };

    const payment = await prisma.payment.findFirst({
      where,
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
      },
    });

    if (!payment) {
      return NextResponse.json(
        { 
          error: 'Pembayaran tidak ditemukan',
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        externalId: payment.externalId, // Order ID (MID-xxx)
        transactionId: payment.transactionId, // Transaction ID Midtrans
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        adminFee: payment.adminFee,
        totalPaid: payment.totalPaid,
        vaNumber: payment.vaNumber,
        expiredAt: payment.expiredAt?.toISOString(),
        paidAt: payment.paidAt?.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        billing: {
          id: payment.billing?.id,
          billNumber: payment.billing?.billNumber,
          type: payment.billing?.type,
          totalAmount: payment.billing?.totalAmount,
          paidAmount: payment.billing?.paidAmount,
          status: payment.billing?.status,
          student: {
            id: payment.billing?.student?.id,
            nama: payment.billing?.student?.nama,
            nisn: payment.billing?.student?.nisn,
          },
        },
      },
    });
  } catch (error) {
    console.error('Payment lookup error:', error);
    return NextResponse.json(
      { error: 'Gagal mencari pembayaran' },
      { status: 500 }
    );
  }
}
