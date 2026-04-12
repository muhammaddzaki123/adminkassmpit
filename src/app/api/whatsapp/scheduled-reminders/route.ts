import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  getCustomizableReminderMessage,
  sendWhatsAppMessage 
} from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/scheduled-reminders
 * Automated scheduled endpoint untuk mengirim reminders
 * Should be called by a cron job (e.g., node-cron, GitHub Actions, atau external cron service)
 * 
 * This endpoint:
 * 1. Sends reminder to BILLED billings 5 days before due date
 * 2. Sends reminder to BILLED billings 1 day before due date
 * 3. Sends overdue reminder to OVERDUE billings daily
 * 
 * Authorization: Requires CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CRON secret
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid CRON_SECRET.' },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const reminders = {
      fiveDaysWarning: 0,
      oneDayWarning: 0,
      overdueReminder: 0,
      failed: 0,
    };

    // 1. Send 5-day reminder for BILLED billings
    const fiveDaysFrom = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const sixDaysFrom = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const billedUpcoming5Days = await prisma.billing.findMany({
      where: {
        status: 'BILLED',
        dueDate: {
          gte: fiveDaysFrom,
          lt: sixDaysFrom,
        },
      },
      include: {
        student: {
          select: {
            nama: true,
            noTelp: true,
          },
        },
      },
    });

    for (const billing of billedUpcoming5Days) {
      if (!billing.student?.noTelp?.trim()) continue;

      const phoneNumber = billing.student.noTelp.startsWith('+')
        ? billing.student.noTelp
        : `+62${billing.student.noTelp.replace(/^0/, '')}`;

      const dueDate = new Date(billing.dueDate!).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const message = await getCustomizableReminderMessage('payment_reminder', {
        studentName: billing.student.nama,
        amount: billing.totalAmount - billing.paidAmount,
        billingType: billing.type,
        dueDate,
        daysUntilDue: 5,
      });

      const result = await sendWhatsAppMessage({
        to: phoneNumber,
        body: message,
        template: 'payment_reminder',
      });

      if (result.success) {
        reminders.fiveDaysWarning++;
      } else {
        reminders.failed++;
      }
    }

    // 2. Send 1-day reminder for BILLED billings
    const oneDayFrom = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const twoDaysFrom = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const billedUpcoming1Day = await prisma.billing.findMany({
      where: {
        status: { in: ['BILLED', 'PARTIAL'] },
        dueDate: {
          gte: oneDayFrom,
          lt: twoDaysFrom,
        },
      },
      include: {
        student: {
          select: {
            nama: true,
            noTelp: true,
          },
        },
      },
    });

    for (const billing of billedUpcoming1Day) {
      if (!billing.student?.noTelp?.trim()) continue;

      const phoneNumber = billing.student.noTelp.startsWith('+')
        ? billing.student.noTelp
        : `+62${billing.student.noTelp.replace(/^0/, '')}`;

      const dueDate = new Date(billing.dueDate!).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const message = await getCustomizableReminderMessage('payment_reminder', {
        studentName: billing.student.nama,
        amount: billing.totalAmount - billing.paidAmount,
        billingType: billing.type,
        dueDate,
        daysUntilDue: 1,
      });

      const result = await sendWhatsAppMessage({
        to: phoneNumber,
        body: message,
        template: 'payment_reminder',
      });

      if (result.success) {
        reminders.oneDayWarning++;
      } else {
        reminders.failed++;
      }
    }

    // 3. Send overdue reminders
    const overdueReminders = await prisma.billing.findMany({
      where: {
        status: { in: ['BILLED', 'PARTIAL', 'OVERDUE'] },
        dueDate: {
          lt: startOfToday,
        },
        OR: [
          { lastReminderSentAt: null },
          {
            lastReminderSentAt: {
              // Only send reminder once per day per billing
              lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        student: {
          select: {
            nama: true,
            noTelp: true,
          },
        },
      },
    });

    for (const billing of overdueReminders) {
      if (!billing.student?.noTelp?.trim()) continue;

      const phoneNumber = billing.student.noTelp.startsWith('+')
        ? billing.student.noTelp
        : `+62${billing.student.noTelp.replace(/^0/, '')}`;

      const dueDate = new Date(billing.dueDate!).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const daysOverdue = Math.floor(
        (now.getTime() - (billing.dueDate?.getTime() || 0)) /
          (1000 * 60 * 60 * 24)
      );

      const message = await getCustomizableReminderMessage('payment_overdue', {
        studentName: billing.student.nama,
        amount: billing.totalAmount - billing.paidAmount,
        billingType: billing.type,
        dueDate,
        daysOverdue: Math.max(daysOverdue, 0),
      });

      const result = await sendWhatsAppMessage({
        to: phoneNumber,
        body: message,
        template: 'payment_overdue',
      });

      if (result.success) {
        reminders.overdueReminder++;
        // Update last reminder sent timestamp
        await prisma.billing.update({
          where: { id: billing.id },
          data: {
            lastReminderSentAt: now,
            ...(billing.status !== 'OVERDUE' ? { status: 'OVERDUE' } : {}),
          },
        });
      } else {
        reminders.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled reminders processed',
      reminders,
      totalSent:
        reminders.fiveDaysWarning +
        reminders.oneDayWarning +
        reminders.overdueReminder,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Scheduled reminders error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process reminders',
      },
      { status: 500 }
    );
  }
}
