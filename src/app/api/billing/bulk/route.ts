import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { BillingStatus, PaymentType } from '@prisma/client';

const INELIGIBLE_STATUSES: BillingStatus[] = ['PAID', 'WAIVED', 'CANCELLED'];

type BulkAction = 'DISCOUNT' | 'INSTALLMENT';

type SkippedItem = { id: string; billNumber: string; reason: string };

function normalizeNumericMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  return Object.entries(raw as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      acc[key] = parsed;
    }
    return acc;
  }, {});
}

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
        studentId: true,
        type: true,
        subtotal: true,
        totalAmount: true,
        paidAmount: true,
        discount: true,
        discountReason: true,
        status: true,
        dueDate: true,
        allowInstallments: true,
        installmentCount: true,
        installmentAmount: true,
        installments: {
          select: {
            installmentNo: true,
            amount: true,
            dueDate: true,
          },
          orderBy: {
            installmentNo: 'asc',
          },
        },
      },
    });

    if (billings.length === 0) {
      return NextResponse.json({ error: 'Billing data not found' }, { status: 404 });
    }

    if (action === 'DISCOUNT') {
      const discountAmount = Number(body.discountAmount || 0);
      const discountReason = String(body.discountReason || '').trim();
      const discountOverrides = normalizeNumericMap(body.discountOverrides);
      const recurringMonths = Number(body.recurringMonths || 0);

      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 });
      }

      if (!discountReason) {
        return NextResponse.json({ error: 'Discount reason is required' }, { status: 400 });
      }

      const toProcess = billings.filter((billing) => !INELIGIBLE_STATUSES.includes(billing.status));
      const skipped: SkippedItem[] = billings
        .filter((billing) => INELIGIBLE_STATUSES.includes(billing.status))
        .map((billing) => ({ id: billing.id, billNumber: billing.billNumber, reason: `Status ${billing.status}` }));

      const validTarget: Array<{
        id: string;
        billNumber: string;
        studentId: string;
        type: PaymentType;
        effectiveDiscount: number;
        oldDiscount: number;
        oldDiscountReason: string | null;
        oldTotalAmount: number;
        oldStatus: BillingStatus;
        newTotalAmount: number;
        newStatus: BillingStatus;
      }> = [];

      for (const billing of toProcess) {
        const override = discountOverrides[billing.id];
        const effectiveDiscount = Number.isFinite(override) && override > 0 ? override : discountAmount;

        if (!Number.isFinite(effectiveDiscount) || effectiveDiscount <= 0) {
          skipped.push({ id: billing.id, billNumber: billing.billNumber, reason: 'Nominal diskon tidak valid' });
          continue;
        }

        if (effectiveDiscount >= billing.subtotal) {
          skipped.push({ id: billing.id, billNumber: billing.billNumber, reason: 'Diskon melebihi/menyamai subtotal' });
          continue;
        }

        const newTotalAmount = Math.max(0, billing.subtotal - effectiveDiscount);
        const normalizedStatus = normalizeStatusForOutstanding(
          billing.status,
          billing.paidAmount,
          newTotalAmount,
          billing.dueDate
        );

        validTarget.push({
          id: billing.id,
          billNumber: billing.billNumber,
          studentId: billing.studentId,
          type: billing.type,
          effectiveDiscount,
          oldDiscount: billing.discount,
          oldDiscountReason: billing.discountReason,
          oldTotalAmount: billing.totalAmount,
          oldStatus: billing.status,
          newTotalAmount,
          newStatus: normalizedStatus,
        });
      }

      const batchId = `bulk-discount-${Date.now()}`;

      await prisma.$transaction(async (tx) => {
        for (const billing of validTarget) {
          await tx.billing.update({
            where: { id: billing.id },
            data: {
              discount: billing.effectiveDiscount,
              discountReason,
              totalAmount: billing.newTotalAmount,
              status: billing.newStatus,
            },
          });

          await tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'APPLY_DISCOUNT_BULK',
              entity: 'Billing',
              entityId: billing.id,
              details: JSON.stringify({
                batchId,
                billNumber: billing.billNumber,
                discountAmount: billing.effectiveDiscount,
                discountReason,
                oldTotal: billing.oldTotalAmount,
                newTotal: billing.newTotalAmount,
              }),
            },
          });
        }

        if (recurringMonths > 0) {
          const planMap = new Map<string, { studentId: string; type: PaymentType; amount: number }>();
          validTarget.forEach((item) => {
            const key = `${item.studentId}-${item.type}`;
            const current = planMap.get(key);
            if (!current || item.effectiveDiscount > current.amount) {
              planMap.set(key, {
                studentId: item.studentId,
                type: item.type,
                amount: item.effectiveDiscount,
              });
            }
          });

          const startDate = new Date();
          const startMonth = startDate.getMonth() + 1;
          const startYear = startDate.getFullYear();

          for (const plan of planMap.values()) {
            const existingPlan = await tx.studentDiscountPlan.findFirst({
              where: {
                studentId: plan.studentId,
                type: plan.type,
                isActive: true,
              },
              orderBy: {
                updatedAt: 'desc',
              },
            });

            if (existingPlan) {
              await tx.studentDiscountPlan.update({
                where: { id: existingPlan.id },
                data: {
                  discountAmount: plan.amount,
                  reason: discountReason,
                  monthsRemaining: recurringMonths,
                  startMonth,
                  startYear,
                  isActive: true,
                },
              });
            } else {
              await tx.studentDiscountPlan.create({
                data: {
                  studentId: plan.studentId,
                  type: plan.type,
                  discountAmount: plan.amount,
                  reason: discountReason,
                  monthsRemaining: recurringMonths,
                  startMonth,
                  startYear,
                  isActive: true,
                  createdById: session.user.id,
                },
              });
            }
          }
        }

        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_DISCOUNT',
            entity: 'BillingBulk',
            entityId: batchId,
            details: JSON.stringify({
              batchId,
              actionType: 'DISCOUNT',
              recurringMonths,
              discountReason,
              processed: validTarget.map((item) => ({
                billingId: item.id,
                billNumber: item.billNumber,
                old: {
                  discount: item.oldDiscount,
                  discountReason: item.oldDiscountReason,
                  totalAmount: item.oldTotalAmount,
                  status: item.oldStatus,
                },
                new: {
                  discount: item.effectiveDiscount,
                  discountReason,
                  totalAmount: item.newTotalAmount,
                  status: item.newStatus,
                },
              })),
              skipped,
              undone: false,
            }),
          },
        });
      });

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

    const skipped: SkippedItem[] = billings
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

    const batchId = `bulk-installment-${Date.now()}`;

    if (toProcess.length > 0) {
      await prisma.$transaction(async (tx) => {
        const undoSnapshot: Array<{
          billingId: string;
          billNumber: string;
          old: {
            allowInstallments: boolean;
            installmentCount: number | null;
            installmentAmount: number | null;
            installments: Array<{ installmentNo: number; amount: number; dueDate: string }>;
          };
          new: {
            allowInstallments: boolean;
            installmentCount: number;
            installmentAmount: number;
          };
        }> = [];

        for (const billing of toProcess) {
          const remaining = Math.max(0, billing.totalAmount - billing.paidAmount);
          const installmentAmount = Number((remaining / installmentCount).toFixed(2));

          undoSnapshot.push({
            billingId: billing.id,
            billNumber: billing.billNumber,
            old: {
              allowInstallments: billing.allowInstallments,
              installmentCount: billing.installmentCount,
              installmentAmount: billing.installmentAmount,
              installments: billing.installments.map((inst) => ({
                installmentNo: inst.installmentNo,
                amount: inst.amount,
                dueDate: inst.dueDate.toISOString(),
              })),
            },
            new: {
              allowInstallments: true,
              installmentCount,
              installmentAmount,
            },
          });

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
                batchId,
                billNumber: billing.billNumber,
                installmentCount,
                installmentAmount,
                remaining,
              }),
            },
          });
        }

        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_INSTALLMENT',
            entity: 'BillingBulk',
            entityId: batchId,
            details: JSON.stringify({
              batchId,
              actionType: 'INSTALLMENT',
              installmentCount,
              respectAllowInstallments,
              processed: undoSnapshot,
              skipped,
              undone: false,
            }),
          },
        });
      });
    } else {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'BULK_INSTALLMENT',
          entity: 'BillingBulk',
          entityId: batchId,
          details: JSON.stringify({
            batchId,
            actionType: 'INSTALLMENT',
            installmentCount,
            respectAllowInstallments,
            processed: [],
            skipped,
            undone: false,
          }),
        },
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
    console.error('❌ Bulk billing action error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      {
        error: 'Failed to process bulk billing action',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      },
      { status: 500 }
    );
  }
}
