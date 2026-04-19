import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOrTreasurer } from '@/lib/auth-helpers';
import { logActivity } from '@/lib/activity-log';

function parseDetails(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        action: 'BACKUP_CREATED',
        entity: 'SystemBackup',
      },
      include: {
        user: {
          select: {
            nama: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const history = logs.map((log) => {
      const details = parseDetails(log.details);
      return {
        id: log.entityId,
        date: log.createdAt,
        type: 'Manual',
        sizeBytes: Number(details.sizeBytes || 0),
        sizeLabel: `${((Number(details.sizeBytes || 0) / (1024 * 1024)) || 0).toFixed(2)} MB`,
        status: 'success',
        createdBy: log.user?.nama || log.user?.username || '-',
      };
    });

    return NextResponse.json({ success: true, data: { history } });
  } catch (error) {
    console.error('Error fetching backup history:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil riwayat backup' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult.session;

  try {
    const backupId = `backup-${Date.now()}`;

    const [
      students,
      billings,
      payments,
      expenses,
      cashLedgerEntries,
      classes,
      academicYears,
      templates,
    ] = await Promise.all([
      prisma.student.findMany(),
      prisma.billing.findMany(),
      prisma.payment.findMany(),
      prisma.expense.findMany(),
      prisma.cashLedgerEntry.findMany(),
      prisma.class.findMany(),
      prisma.academicYear.findMany(),
      prisma.billingTemplate.findMany(),
    ]);

    const snapshot = {
      backupId,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: session.user.id,
        username: session.user.username,
        nama: session.user.nama,
        role: session.user.role,
      },
      summary: {
        students: students.length,
        billings: billings.length,
        payments: payments.length,
        expenses: expenses.length,
        cashLedgerEntries: cashLedgerEntries.length,
        classes: classes.length,
        academicYears: academicYears.length,
        billingTemplates: templates.length,
      },
      data: {
        students,
        billings,
        payments,
        expenses,
        cashLedgerEntries,
        classes,
        academicYears,
        billingTemplates: templates,
      },
    };

    const serialized = JSON.stringify(snapshot, null, 2);
    const sizeBytes = Buffer.byteLength(serialized, 'utf8');
    const fileName = `${backupId}.json`;

    await logActivity({
      userId: session.user.id,
      action: 'BACKUP_CREATED',
      entity: 'SystemBackup',
      entityId: backupId,
      details: {
        target: fileName,
        message: `Membuat backup data sistem (${fileName})`,
        status: 'success',
        sizeBytes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        backupId,
        fileName,
        sizeBytes,
        content: serialized,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat backup data' },
      { status: 500 }
    );
  }
}
