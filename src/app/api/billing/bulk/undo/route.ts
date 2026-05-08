import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

type UndoActionType = 'DISCOUNT' | 'INSTALLMENT';

function resolveActionName(actionType: UndoActionType) {
  return actionType === 'DISCOUNT' ? 'BULK_DISCOUNT' : 'BULK_INSTALLMENT';
}

function parseDetails(details: string | null) {
  if (!details) return null;
  try {
    return JSON.parse(details) as {
      batchId: string;
      actionType: UndoActionType;
      processed: Array<Record<string, unknown>>;
      skipped: Array<Record<string, unknown>>;
      undone?: boolean;
      undoneAt?: string;
      undoneBy?: string;
    };
  } catch {
    return null;
  }
}

async function getLatestUndoCandidate(userId: string, actionType: UndoActionType) {
  const action = resolveActionName(actionType);

  const candidate = await prisma.activityLog.findFirst({
    where: {
      userId,
      action,
      entity: 'BillingBulk',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!candidate) return null;

  const details = parseDetails(candidate.details);
  if (!details) return null;

  return {
    log: candidate,
    details,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const actionTypeRaw = String(searchParams.get('action') || 'DISCOUNT').toUpperCase();
    const actionType: UndoActionType = actionTypeRaw === 'INSTALLMENT' ? 'INSTALLMENT' : 'DISCOUNT';

    const candidate = await getLatestUndoCandidate(session.user.id, actionType);
    if (!candidate) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const processedCount = Array.isArray(candidate.details.processed) ? candidate.details.processed.length : 0;
    const skippedCount = Array.isArray(candidate.details.skipped) ? candidate.details.skipped.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        logId: candidate.log.id,
        actionType,
        batchId: candidate.details.batchId,
        processedCount,
        skippedCount,
        createdAt: candidate.log.createdAt,
        undone: candidate.details.undone === true,
        undoneAt: candidate.details.undoneAt || null,
      },
    });
  } catch (error) {
    console.error('Get bulk undo info error:', error);
    return NextResponse.json({ error: 'Failed to get bulk undo info' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const actionTypeRaw = String(body.actionType || 'DISCOUNT').toUpperCase();
    const actionType: UndoActionType = actionTypeRaw === 'INSTALLMENT' ? 'INSTALLMENT' : 'DISCOUNT';

    const candidate = await getLatestUndoCandidate(session.user.id, actionType);
    if (!candidate) {
      return NextResponse.json({ error: 'Tidak ada aksi massal yang bisa di-undo.' }, { status: 404 });
    }

    if (candidate.details.undone === true) {
      return NextResponse.json({ error: 'Aksi massal terakhir sudah pernah di-undo.' }, { status: 400 });
    }

    if (actionType === 'DISCOUNT') {
      const processed = Array.isArray(candidate.details.processed) ? candidate.details.processed : [];

      await prisma.$transaction(async (tx) => {
        for (const item of processed) {
          const billingId = String(item.billingId || '');
          const old = (item.old || {}) as {
            discount?: number;
            discountReason?: string | null;
            totalAmount?: number;
            status?: string;
          };

          if (!billingId) continue;

          await tx.billing.update({
            where: { id: billingId },
            data: {
              discount: Number(old.discount || 0),
              discountReason: old.discountReason ?? null,
              totalAmount: Number(old.totalAmount || 0),
              status: (old.status as 'BILLED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'WAIVED' | 'UNBILLED') || 'BILLED',
            },
          });
        }

        await tx.activityLog.update({
          where: { id: candidate.log.id },
          data: {
            details: JSON.stringify({
              ...candidate.details,
              undone: true,
              undoneAt: new Date().toISOString(),
              undoneBy: session.user.id,
            }),
          },
        });

        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'UNDO_BULK_DISCOUNT',
            entity: 'BillingBulk',
            entityId: candidate.details.batchId,
            details: JSON.stringify({
              sourceLogId: candidate.log.id,
              actionType,
              processedCount: processed.length,
            }),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Undo diskon massal berhasil untuk ${processed.length} tagihan.`,
      });
    }

    const processed = Array.isArray(candidate.details.processed) ? candidate.details.processed : [];

    await prisma.$transaction(async (tx) => {
      for (const item of processed) {
        const billingId = String(item.billingId || '');
        const old = (item.old || {}) as {
          allowInstallments?: boolean;
          installmentCount?: number | null;
          installmentAmount?: number | null;
          installments?: Array<{ installmentNo: number; amount: number; dueDate: string }>;
        };

        if (!billingId) continue;

        await tx.installment.deleteMany({ where: { billingId } });

        const oldInstallments = Array.isArray(old.installments) ? old.installments : [];
        if (oldInstallments.length > 0) {
          await tx.installment.createMany({
            data: oldInstallments.map((inst) => ({
              billingId,
              installmentNo: Number(inst.installmentNo),
              amount: Number(inst.amount),
              dueDate: new Date(inst.dueDate),
            })),
          });
        }

        await tx.billing.update({
          where: { id: billingId },
          data: {
            allowInstallments: old.allowInstallments ?? false,
            installmentCount: old.installmentCount ?? null,
            installmentAmount: old.installmentAmount ?? null,
          },
        });
      }

      await tx.activityLog.update({
        where: { id: candidate.log.id },
        data: {
          details: JSON.stringify({
            ...candidate.details,
            undone: true,
            undoneAt: new Date().toISOString(),
            undoneBy: session.user.id,
          }),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'UNDO_BULK_INSTALLMENT',
          entity: 'BillingBulk',
          entityId: candidate.details.batchId,
          details: JSON.stringify({
            sourceLogId: candidate.log.id,
            actionType,
            processedCount: processed.length,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Undo cicilan massal berhasil untuk ${processed.length} tagihan.`,
    });
  } catch (error) {
    console.error('Undo bulk action error:', error);
    return NextResponse.json({ error: 'Failed to undo bulk action' }, { status: 500 });
  }
}
