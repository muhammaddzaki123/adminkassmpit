import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

type ActivityStatus = 'success' | 'failed';

function parseDetails(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          ...(action && action !== 'all' ? { action } : {}),
        },
        include: {
          user: {
            select: {
              username: true,
              nama: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({
        where: {
          ...(action && action !== 'all' ? { action } : {}),
        },
      }),
    ]);

    const normalized = logs
      .map((log) => {
        const details = parseDetails(log.details);
        const statusValue = details.status === 'failed' ? 'failed' : 'success';
        const target = (details.target as string | undefined) || log.entityId;
        const detailText =
          (details.message as string | undefined) ||
          (details.description as string | undefined) ||
          `${log.action} pada ${log.entity}`;

        return {
          id: log.id,
          user: log.user?.username || log.user?.nama || '-',
          action: log.action,
          target,
          status: statusValue as ActivityStatus,
          timestamp: log.createdAt,
          details: detailText,
          entity: log.entity,
        };
      })
      .filter((log) => (status && status !== 'all' ? log.status === status : true));

    return NextResponse.json({
      success: true,
      data: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil activity log' },
      { status: 500 }
    );
  }
}
