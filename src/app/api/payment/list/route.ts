import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Prisma, PaymentStatus, PaymentMethod } from '@prisma/client';

// GET /api/payment/list - List payments with filters (treasurer only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only treasurer or admin can view payments list' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const studentId = searchParams.get('studentId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Prisma.PaymentWhereInput = {};

    if (status) {
      where.status = status as PaymentStatus;
    }

    if (method) {
      where.method = method as PaymentMethod;
    }

    if (studentId) {
      where.billing = {
        studentId: studentId,
      };
    }

    // Search by student name or payment number
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        {
          billing: {
            student: {
              OR: [
                { nama: { contains: search, mode: 'insensitive' } },
                { nisn: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          billing: {
            include: {
              student: {
                include: {
                  studentClasses: {
                    where: { isActive: true },
                    include: {
                      class: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          },
          details: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate summary
    const summaryData = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        adminFee: true,
        totalPaid: true,
      },
      _count: true,
    });

    // Format payments
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      billing: {
        id: payment.billing?.id || '',
        billNumber: payment.billing?.billNumber || '',
        type: payment.billing?.type || 'SPP',
        student: {
          id: payment.billing?.student?.id || '',
          nis: payment.billing?.student?.nisn || '',
          fullName: payment.billing?.student?.nama || '',
          className: payment.billing?.student?.studentClasses[0]?.class.name || '-',
        },
      },
      method: payment.method,
      amount: payment.amount,
      adminFee: payment.adminFee,
      totalPaid: payment.totalPaid,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      notes: payment.notes,
      receiptUrl: payment.receiptUrl,
      paymentDetails: payment.details || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalAmount: summaryData._sum?.amount || 0,
          totalAdminFee: summaryData._sum?.adminFee || 0,
          totalPaid: summaryData._sum?.totalPaid || 0,
          count: summaryData._count,
        },
      },
    });
  } catch (error) {
    console.error('Get payment list error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get payment list', details: errorMessage },
      { status: 500 }
    );
  }
}
