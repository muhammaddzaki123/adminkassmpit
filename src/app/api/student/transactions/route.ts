import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID required' },
        { status: 400 }
      );
    }

    // Get student's payment history
    const payments = await prisma.payment.findMany({
      where: {
        billing: {
          studentId: studentId,
        },
      },
      include: {
        billing: {
          select: {
            type: true,
            month: true,
            year: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transactions = payments.map((payment) => ({
      id: payment.id,
      paymentType: payment.billing.type || 'SPP',
      amount: payment.amount,
      adminFee: payment.adminFee || 0,
      totalAmount: payment.amount + (payment.adminFee || 0),
      status: payment.status,
      paymentMethod: payment.method || 'VIRTUAL_ACCOUNT',
      description: payment.notes || payment.billing.description || '',
      vaNumber: payment.vaNumber,
      paidAt: payment.paidAt?.toISOString(),
      expiredAt: payment.expiredAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching student transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
