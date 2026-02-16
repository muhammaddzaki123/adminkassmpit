import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Prisma, BillingStatus, PaymentType } from '@prisma/client';

// GET /api/billing/list - Treasurer views all billings with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only treasurer or admin can view all billings' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const classId = searchParams.get('classId');
    const type = searchParams.get('type');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Prisma.BillingWhereInput = {};

    if (status) {
      where.status = status as BillingStatus;
    }

    if (type) {
      where.type = type as PaymentType;
    }

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    // Search by student name or NIS and filter by class
    if (search || classId) {
      const studentWhere: Prisma.StudentWhereInput = {};
      
      if (search) {
        studentWhere.OR = [
          { nama: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (classId) {
        studentWhere.studentClasses = {
          some: {
            classId: classId,
            isActive: true,
          },
        };
      }
      
      where.student = studentWhere;
    }

    const skip = (page - 1) * limit;

    // Get billings with pagination
    const [billings, total] = await Promise.all([
      prisma.billing.findMany({
        where,
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
          payments: {
            where: {
              status: 'COMPLETED',
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.billing.count({ where }),
    ]);

    // Calculate summary statistics
    const summaryData = await prisma.billing.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      _count: true,
    });

    const totalAmount = summaryData._sum.totalAmount || 0;
    const totalPaid = summaryData._sum.paidAmount || 0;
    const totalOutstanding = totalAmount - totalPaid;

    // Count by status
    const statusCounts = await prisma.billing.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Format billings
    const formattedBillings = billings.map(billing => ({
      id: billing.id,
      billNumber: billing.billNumber,
      student: {
        id: billing.student?.id || '',
        nis: billing.student?.nisn || '',
        fullName: billing.student?.nama || '',
        className: billing.student?.studentClasses[0]?.class.name || '-',
      },
      type: billing.type,
      month: billing.month,
      year: billing.year,
      description: billing.description,
      totalAmount: billing.totalAmount,
      paidAmount: billing.paidAmount,
      remainingAmount: billing.totalAmount - billing.paidAmount,
      status: billing.status,
      dueDate: billing.dueDate,
      createdAt: billing.createdAt,
      payments: billing.payments || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        billings: formattedBillings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalAmount,
          totalPaid,
          totalOutstanding,
          statusCounts: statusSummary,
        },
      },
    });
  } catch (error) {
    console.error('Get billing list error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get billing list', details: errorMessage },
      { status: 500 }
    );
  }
}
