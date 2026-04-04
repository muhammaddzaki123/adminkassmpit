import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';
import { 
  getPaymentReminderMessage, 
  getPaymentOverdueMessage,
  sendWhatsAppMessage 
} from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/send-reminder - Send payment reminder to specific students
 * Body: { billingIds?: string[], classIds?: string[], status?: 'BILLED' | 'OVERDUE' | 'PARTIAL' }
 * Permission: TREASURER or ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDashboardAccess(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { billingIds, classIds, status } = body;

    // Build where clause
    const where: Record<string, unknown> = {
      status: status ? status : { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    };

    if (billingIds?.length > 0) {
      where.id = { in: billingIds };
    } else if (classIds?.length > 0) {
      where.student = {
        studentClasses: {
          some: {
            classId: { in: classIds },
            isActive: true,
          },
        },
      };
    }

    // Get billings with student info
    const billings = await prisma.billing.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            noTelp: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
    });

    if (billings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No billings found matching criteria' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Send reminders
    const results = await Promise.all(
      billings.map(async (billing) => {
        if (billing.lastReminderSentAt && billing.lastReminderSentAt >= startOfToday) {
          return {
            billingId: billing.id,
            studentName: billing.student?.nama,
            sent: false,
            skipped: true,
            reason: 'Reminder sudah dikirim hari ini (throttle aktif)',
          };
        }

        if (!billing.student?.noTelp) {
          return {
            billingId: billing.id,
            studentName: billing.student?.nama,
            sent: false,
            skipped: true,
            reason: 'No phone number',
          };
        }

        const phoneNumber = billing.student.noTelp.startsWith('+')
          ? billing.student.noTelp
          : `+62${billing.student.noTelp.replace(/^0/, '')}`;

        const dueDate = billing.dueDate
          ? new Date(billing.dueDate).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'TBD';

        let message = '';
        let template: 'payment_reminder' | 'payment_overdue' = 'payment_reminder';

        if (billing.status === 'OVERDUE') {
          const now = new Date();
          const daysOverdue = Math.floor(
            (now.getTime() - (billing.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)
          );

          message = getPaymentOverdueMessage({
            studentName: billing.student.nama,
            amount: billing.totalAmount - billing.paidAmount,
            billingType: billing.type,
            dueDate,
            daysOverdue: Math.max(daysOverdue, 0),
          });
          template = 'payment_overdue';
        } else {
          const daysUntilDue = billing.dueDate
            ? Math.ceil(
                (new Date(billing.dueDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : undefined;

          message = getPaymentReminderMessage({
            studentName: billing.student.nama,
            amount: billing.totalAmount - billing.paidAmount,
            billingType: billing.type,
            dueDate,
            daysUntilDue,
          });
        }

        const result = await sendWhatsAppMessage({
          to: phoneNumber,
          body: message,
          template,
        });

        if (result.success) {
          await prisma.billing.update({
            where: { id: billing.id },
            data: { lastReminderSentAt: now },
          });
        }

        await prisma.notificationLog.create({
          data: {
            type: 'WHATSAPP',
            status: result.success ? 'SENT' : 'FAILED',
            recipient: phoneNumber,
            subject: `Reminder ${template}`,
            content: message.substring(0, 500),
            template,
            metadata: JSON.stringify({
              source: 'treasurer_wa_reminder',
              billingId: billing.id,
              studentId: billing.student.id,
              messageId: result.messageId || null,
            }),
            sentAt: result.success ? now : null,
          },
        });

        return {
          billingId: billing.id,
          studentName: billing.student.nama,
          sent: result.success,
          skipped: false,
          reason: result.error || 'OK',
          messageId: result.messageId,
        };
      })
    );

    // Count results
    const successful = results.filter((r) => r.sent).length;
    const skipped = results.filter((r) => !r.sent && r.skipped).length;
    const failed = results.filter((r) => !r.sent && !r.skipped).length;

    return NextResponse.json({
      success: true,
      message: `Reminder terkirim ${successful}, gagal ${failed}, skip ${skipped}`,
      total: results.length,
      successful,
      failed,
      skipped,
      results,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to send reminders',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/send-reminder - Get pending reminders (preview)
 * Query: ?classIds=id1,id2&status=OVERDUE
 * Permission: TREASURER or ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDashboardAccess(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const classIdsParam = searchParams.get('classIds');
    const status = searchParams.get('status');
    const pageParam = Number(searchParams.get('page') || 1);
    const pageSizeParam = Number(searchParams.get('pageSize') || 20);
    const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.min(Math.max(pageSizeParam, 1), 100)
      : 20;

    // Build where clause
    const where: Record<string, unknown> = {
      status: status ? status : { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    };

    if (classIdsParam) {
      const classIds = classIdsParam.split(',').filter(Boolean);
      if (classIds.length > 0) {
        where.student = {
          studentClasses: {
            some: {
              classId: { in: classIds },
              isActive: true,
            },
          },
        };
      }
    }

    const total = await prisma.billing.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);

    // Get pending billings
    const pendingReminders = await prisma.billing.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            noTelp: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    // Format response
    const reminders = pendingReminders.map((billing) => ({
      billingId: billing.id,
      studentId: billing.studentId,
      studentName: billing.student?.nama,
      nisn: billing.student?.nisn,
      hasPhoneNumber: !!billing.student?.noTelp,
      phoneNumber: billing.student?.noTelp ? billing.student.noTelp.replace(/^62/, '0') : null,
      billingType: billing.type,
      totalAmount: billing.totalAmount,
      paidAmount: billing.paidAmount,
      remainingAmount: billing.totalAmount - billing.paidAmount,
      status: billing.status,
      dueDate: billing.dueDate,
      lastReminderSentAt: billing.lastReminderSentAt,
      throttledToday:
        !!billing.lastReminderSentAt &&
        new Date(billing.lastReminderSentAt).setHours(0, 0, 0, 0) ===
          new Date().setHours(0, 0, 0, 0),
      isOverdue: billing.dueDate && new Date(billing.dueDate) < new Date(),
    }));

    return NextResponse.json({
      success: true,
      total,
      page: safePage,
      pageSize,
      totalPages,
      canSendTo: reminders.filter((r) => r.hasPhoneNumber).length,
      data: reminders,
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch reminders',
      },
      { status: 500 }
    );
  }
}
