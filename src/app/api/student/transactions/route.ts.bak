import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status'); // Filter by status
    const paymentType = searchParams.get('paymentType'); // Filter by type
    const limit = searchParams.get('limit');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Build query filters
    const where: {
      studentId: string;
      status?: string;
      paymentType?: string;
    } = {
      studentId
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentType && paymentType !== 'ALL') {
      where.paymentType = paymentType as never;
    }

    // Fetch transactions from database
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Calculate summary
    const summary = {
      total: transactions.length,
      paid: transactions.filter(t => t.status === 'PAID').length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      totalAmount: transactions
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + t.totalAmount, 0)
    };

    return NextResponse.json({
      success: true,
      data: transactions.map(t => ({
        id: t.id,
        externalId: t.externalId,
        paymentType: t.paymentType,
        paymentMethod: t.paymentMethod,
        amount: t.amount,
        adminFee: t.adminFee,
        totalAmount: t.totalAmount,
        status: t.status,
        vaNumber: t.vaNumber,
        description: t.description,
        bulan: t.bulan,
        tahunAjaran: t.tahunAjaran,
        expiredAt: t.expiredAt?.toISOString(),
        paidAt: t.paidAt?.toISOString(),
        createdAt: t.createdAt.toISOString()
      })),
      summary
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
