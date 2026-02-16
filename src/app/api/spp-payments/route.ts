import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const studentId = searchParams.get('studentId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (studentId) {
      where.billing = { studentId };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryOptions: any = {
      where,
      include: {
        billing: {
          include: {
            student: {
              select: {
                nama: true,
                nisn: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = await prisma.payment.findMany(queryOptions) as any[];

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentType: payment.billing.type || 'SPP',
      amount: payment.amount,
      adminFee: payment.adminFee || 0,
      totalAmount: payment.amount + (payment.adminFee || 0),
      status: payment.status,
      paymentMethod: payment.method || 'VIRTUAL_ACCOUNT',
      student: {
        fullName: payment.billing.student.nama,
        nis: payment.billing.student.nisn,
      },
      month: payment.billing.month,
      year: payment.billing.year,
      description: payment.notes || payment.billing.description,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPayments,
    });
  } catch (error) {
    console.error('Error fetching SPP payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
