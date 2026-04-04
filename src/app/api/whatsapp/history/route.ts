import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';

/**
 * GET /api/whatsapp/history
 * Query: ?status=ALL|SENT|FAILED&page=1&pageSize=20
 * Permission: TREASURER or ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDashboardAccess(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'ALL').toUpperCase();
    const pageParam = Number(searchParams.get('page') || 1);
    const pageSizeParam = Number(searchParams.get('pageSize') || 20);

    const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.min(Math.max(pageSizeParam, 1), 100)
      : 20;

    const where = {
      type: 'WHATSAPP',
      template: {
        in: ['payment_reminder', 'payment_overdue'],
      },
      ...(status !== 'ALL' ? { status } : {}),
    };

    const total = await prisma.notificationLog.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);

    const logs = await prisma.notificationLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    const data = logs.map((log) => {
      let metadata: Record<string, unknown> | null = null;
      try {
        metadata = log.metadata ? (JSON.parse(log.metadata) as Record<string, unknown>) : null;
      } catch {
        metadata = null;
      }

      return {
        id: log.id,
        status: log.status,
        recipient: log.recipient,
        template: log.template,
        subject: log.subject,
        createdAt: log.createdAt,
        sentAt: log.sentAt,
        metadata,
      };
    });

    return NextResponse.json({
      success: true,
      total,
      page: safePage,
      pageSize,
      totalPages,
      status,
      data,
    });
  } catch (error) {
    console.error('WhatsApp history error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch WhatsApp history',
      },
      { status: 500 }
    );
  }
}
