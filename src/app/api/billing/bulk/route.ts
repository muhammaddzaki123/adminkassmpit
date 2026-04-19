import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { BillingStatus } from '@prisma/client';

const INELIGIBLE_STATUSES: BillingStatus[] = ['PAID', 'WAIVED', 'CANCELLED'];

type BulkAction = 'DISCOUNT' | 'INSTALLMENT';

function normalizeStatusForOutstanding(currentStatus: BillingStatus, paidAmount: number, totalAmount: number, dueDate: Date): BillingStatus {
  if (paidAmount >= totalAmount) return 'PAID';
  if (paidAmount > 0) return 'PARTIAL';

  if (currentStatus === 'OVERDUE' || dueDate.getTime() < Date.now()) {
    return 'OVERDUE';
  }

  return 'BILLED';
}

// POST /api/billing/bulk - bulk discount/installment actions for treasurer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only treasurer or admin can apply bulk billing actions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = String(body.action || '').toUpperCase() as BulkAction;
    const rawBillingIds: unknown[] = Array.isArray(body.billingIds) ? body.billingIds : [];
    const billingIds = rawBillingIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);

    if (!['DISCOUNT', 'INSTALLMENT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (billingIds.length === 0) {
      return NextResponse.json({ error: 'No billing selected' }, { status: 400 });
    }

    const billings = await prisma.billing.findMany({
      where: { id: { in: billingIds } },
      select: {
        id: true,
        billNumber: true,
        subtotal: true,
        totalAmount: true,
        paidAmount: true,
        discount: true,
        status: true,
        dueDate: true,
        allowInstallments: true,
      },
    });

    if (billings.length === 0) {
      return NextResponse.json({ error: 'Billing data not found' }, { status: 404 });
    }

    if (action === 'DISCOUNT') {
      const discountAmount = Number(body.discountAmount || 0);
      const discountReason = String(body.discountReason || '').trim();

      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 });
      }

      if (!discountReason) {
        return NextResponse.json({ error: 'Discount reason is required' }, { status: 400 });
      }

      const toProcess = billings.filter((billing) => !INELIGIBLE_STATUSES.includes(billing.status));
      const skipped = billings
        .filter((billing) => INELIGIBLE_STATUSES.includes(billing.status))
        .map((billing) => ({ id: billing.id, billNumber: billing.billNumber, reason: `Status ${billing.status}` }));

      const invalidDiscount = toProcess.filter((billing) => discountAmount >= billing.subtotal);
      const validTarget = toProcess.filter((billing) => discountAmount < billing.subtotal);

      skipped.push(
        ...invalidDiscount.map((billing) => ({ id: billing.id, billNumber: billing.billNumber, reason: 'Diskon melebihi/menyamai subtotal' }))
      );

      const operations = validTarget.flatMap((billing) => {
        const newTotalAmount = Math.max(0, billing.subtotal - discountAmount);
        const normalizedStatus = normalizeStatusForOutstanding(
          billing.status,
          billing.paidAmount,
          newTotalAmount,
          billing.dueDate
        );

        return [
          prisma.billing.update({
            where: { id: billing.id },
            data: {
              discount: discountAmount,
              discountReason,
              totalAmount: newTotalAmount,
              status: normalizedStatus,
            },
          }),
          prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'APPLY_DISCOUNT_BULK',
              entity: 'Billing',
              entityId: billing.id,
              details: JSON.stringify({
                billNumber: billing.billNumber,
                discountAmount,
                discountReason,
                oldTotal: billing.totalAmount,
                newTotal: newTotalAmount,
              }),
            },
          }),
        ];
      });

      if (operations.length > 0) {
        await prisma.$transaction(operations);
      }

      return NextResponse.json({
        success: true,
        message: `Diskon massal berhasil diproses untuk ${validTarget.length} tagihan`,
        data: {
          action,
          requested: billingIds.length,
          processed: validTarget.length,
          skipped,
        },
      });
    }

    const installmentCount = Number(body.installmentCount || 0);
    const respectAllowInstallments = body.respectAllowInstallments !== false;

    if (!Number.isInteger(installmentCount) || installmentCount < 1) {
      return NextResponse.json({ error: 'Invalid installment count' }, { status: 400 });
    }

    const toProcess = billings.filter((billing) => {
      if (INELIGIBLE_STATUSES.includes(billing.status)) return false;
      if (billing.totalAmount - billing.paidAmount <= 0) return false;
      if (respectAllowInstallments && !billing.allowInstallments) return false;
      return true;
    });

    const skipped = billings
      .filter((billing) => {
        if (INELIGIBLE_STATUSES.includes(billing.status)) return true;
        if (billing.totalAmount - billing.paidAmount <= 0) return true;
        if (respectAllowInstallments && !billing.allowInstallments) return true;
        return false;
      })
      .map((billing) => {
        if (INELIGIBLE_STATUSES.includes(billing.status)) {
          return { id: billing.id, billNumber: billing.billNumber, reason: `Status ${billing.status}` };
        }
        if (billing.totalAmount - billing.paidAmount <= 0) {
          return { id: billing.id, billNumber: billing.billNumber, reason: 'Sisa tagihan 0' };
        }
        return { id: billing.id, billNumber: billing.billNumber, reason: 'Siswa tidak diizinkan cicilan' };
      });

    if (toProcess.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const billing of toProcess) {
          const remaining = Math.max(0, billing.totalAmount - billing.paidAmount);
          const installmentAmount = Number((remaining / installmentCount).toFixed(2));

          await tx.installment.deleteMany({ where: { billingId: billing.id } });

          const baseDueDate = billing.dueDate;
          const newInstallments = Array.from({ length: installmentCount }, (_, index) => {
            const dueDate = new Date(baseDueDate);
            dueDate.setMonth(dueDate.getMonth() + index);

            return {
              billingId: billing.id,
              installmentNo: index + 1,
              amount: installmentAmount,
              dueDate,
            };
          });

          await tx.installment.createMany({ data: newInstallments });

          await tx.billing.update({
            where: { id: billing.id },
            data: {
              allowInstallments: true,
              installmentCount,
              installmentAmount,
            },
          });

          await tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'SET_INSTALLMENT_BULK',
              entity: 'Billing',
              entityId: billing.id,
              details: JSON.stringify({
                billNumber: billing.billNumber,
                installmentCount,
                installmentAmount,
                remaining,
              }),
            },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pengaturan cicilan massal berhasil diproses untuk ${toProcess.length} tagihan`,
      data: {
        action,
        requested: billingIds.length,
        processed: toProcess.length,
        skipped,
      },
    });
  } catch (error) {
    console.error('Bulk billing action error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process bulk billing action',
      },
      { status: 500 }
    );
  }
}
