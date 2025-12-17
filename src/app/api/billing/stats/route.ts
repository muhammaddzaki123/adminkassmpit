import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/billing/stats - Get billing statistics
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !['TREASURER', 'ADMIN', 'HEADMASTER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get counts by status
    const [totalBilled, totalPaid, totalPartial, totalOverdue] = await Promise.all([
      prisma.billing.count({
        where: { status: 'BILLED' },
      }),
      prisma.billing.count({
        where: { status: 'PAID' },
      }),
      prisma.billing.count({
        where: { status: 'PARTIAL' },
      }),
      prisma.billing.count({
        where: { status: 'OVERDUE' },
      }),
    ]);

    // Get total amounts
    const totalAmounts = await prisma.billing.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Get monthly stats (current year)
    const currentYear = new Date().getFullYear();
    const monthlyBillings = await prisma.billing.groupBy({
      by: ['month', 'status'],
      where: {
        year: currentYear,
      },
      _count: true,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalBilled,
        totalPaid,
        totalPartial,
        totalOverdue,
        totalAmount: totalAmounts._sum.totalAmount || 0,
        totalPaidAmount: totalAmounts._sum.paidAmount || 0,
        monthlyBillings,
      },
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
