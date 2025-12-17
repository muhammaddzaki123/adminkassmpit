import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Check payment status from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const externalId = searchParams.get('externalId');

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { error: 'Transaction ID or External ID required' },
        { status: 400 }
      );
    }

    // Find transaction by ID or externalId
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { id: transactionId || '' },
          { externalId: externalId || '' }
        ]
      },
      include: {
        student: {
          select: {
            nama: true,
            nisn: true,
            kelas: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        externalId: transaction.externalId,
        status: transaction.status,
        paymentType: transaction.paymentType,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        adminFee: transaction.adminFee,
        totalAmount: transaction.totalAmount,
        vaNumber: transaction.vaNumber,
        expiredAt: transaction.expiredAt?.toISOString(),
        paidAt: transaction.paidAt?.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        student: transaction.student
      },
    });
  } catch (error) {
    console.error('Check payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
