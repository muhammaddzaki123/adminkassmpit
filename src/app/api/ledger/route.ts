import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LedgerDirection, ExpenseStatus, PaymentStatus, Prisma } from '@prisma/client';
import { requireTreasurer } from '@/lib/auth-helpers';

type LedgerPeriod = 'monthly' | 'yearly' | 'all';
type LedgerDirectionFilter = 'all' | 'income' | 'expense';

type LedgerItem = {
  id: string;
  entryNumber: string;
  date: string;
  direction: LedgerDirection;
  source: string;
  category: string;
  description: string | null;
  amount: number;
  referenceNumber?: string | null;
  notes?: string | null;
  status: string;
  origin: 'SPP_PAYMENT' | 'EXPENSE' | 'MANUAL';
  student?: {
    nama: string;
    kelas: string;
    nisn: string;
  };
  paymentMethod?: string;
};

function getPeriodRange(period: LedgerPeriod, monthValue: number, yearValue: number) {
  if (period === 'all') {
    return null;
  }

  if (period === 'yearly') {
    return {
      start: new Date(yearValue, 0, 1),
      end: new Date(yearValue, 11, 31, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(yearValue, monthValue - 1, 1),
    end: new Date(yearValue, monthValue, 0, 23, 59, 59, 999),
  };
}

function getEntryNumberFallback(prefix: string, id: string) {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

function matchesSearch(entry: LedgerItem, query: string) {
  if (!query) return true;

  const normalizedQuery = query.toLowerCase();
  const haystack = [
    entry.entryNumber,
    entry.source,
    entry.category,
    entry.description,
    entry.referenceNumber || '',
    entry.notes || '',
    entry.student?.nama || '',
    entry.student?.kelas || '',
    entry.student?.nisn || '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function buildSummary(entries: LedgerItem[]) {
  const incomeBySource: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  let totalIncome = 0;
  let totalExpense = 0;

  for (const entry of entries) {
    if (entry.direction === 'INCOME') {
      totalIncome += entry.amount;
      incomeBySource[entry.source] = (incomeBySource[entry.source] || 0) + entry.amount;
    } else {
      totalExpense += entry.amount;
      expenseByCategory[entry.category] = (expenseByCategory[entry.category] || 0) + entry.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeBySource,
    expenseByCategory,
    incomeCount: entries.filter((entry) => entry.direction === 'INCOME').length,
    expenseCount: entries.filter((entry) => entry.direction === 'EXPENSE').length,
  };
}

function isCashLedgerSchemaMissing(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code !== 'P2021' && error.code !== 'P2022') {
      return false;
    }

    const table = String(error.meta?.table || '').toLowerCase();
    const column = String(error.meta?.column || '').toLowerCase();

    return table.includes('cash_ledger_entries') || column.includes('cash_ledger_entries');
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('cash_ledger_entries');
  }

  return false;
}

export async function GET(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'monthly') as LedgerPeriod;
    const direction = (searchParams.get('direction') || 'all') as LedgerDirectionFilter;
    const search = (searchParams.get('search') || '').trim();
    const year = Number(searchParams.get('year') || new Date().getFullYear());
    const month = Number(searchParams.get('month') || new Date().getMonth() + 1);

    const range = getPeriodRange(period, month, year);

    const paymentWhere: Record<string, unknown> = {
      status: PaymentStatus.COMPLETED,
    };

    const expenseWhere: Record<string, unknown> = {
      status: ExpenseStatus.APPROVED,
    };

    const manualWhere: Record<string, unknown> = {};

    if (range) {
      paymentWhere.paidAt = {
        gte: range.start,
        lte: range.end,
      };
      expenseWhere.date = {
        gte: range.start,
        lte: range.end,
      };
      manualWhere.date = {
        gte: range.start,
        lte: range.end,
      };
    }

    if (direction === 'income') {
      manualWhere.direction = LedgerDirection.INCOME;
    } else if (direction === 'expense') {
      manualWhere.direction = LedgerDirection.EXPENSE;
    }

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: paymentWhere,
        include: {
          billing: {
            include: {
              student: {
                include: {
                  studentClasses: {
                    where: { isActive: true },
                    include: { class: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: 'asc',
        },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        orderBy: {
          date: 'asc',
        },
      }),
    ]);

    let manualEntries: Prisma.CashLedgerEntryGetPayload<{
      include: {
        createdBy: {
          select: {
            nama: true;
            username: true;
          };
        };
      };
    }>[] = [];
    try {
      manualEntries = await prisma.cashLedgerEntry.findMany({
        where: manualWhere,
        include: {
          createdBy: {
            select: {
              nama: true,
              username: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    } catch (manualError) {
      if (isCashLedgerSchemaMissing(manualError)) {
        console.warn('cash_ledger_entries table is not available yet, serving ledger without manual entries');
      } else {
        throw manualError;
      }
    }

    const combinedEntries: LedgerItem[] = [
      ...payments.map((payment) => ({
        id: payment.id,
        entryNumber: payment.paymentNumber,
        date: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
        direction: LedgerDirection.INCOME,
        source: 'SPP',
        category: payment.billing.type || 'SPP',
        description: payment.billing.description || payment.notes || payment.billing.type || 'Pembayaran SPP',
        amount: payment.amount,
        referenceNumber: payment.billing.billNumber,
        notes: payment.notes,
        status: payment.status,
        origin: 'SPP_PAYMENT' as const,
        student: {
          nama: payment.billing.student.nama,
          kelas: payment.billing.student.studentClasses?.[0]?.class?.name || '-',
          nisn: payment.billing.student.nisn,
        },
        paymentMethod: payment.method,
      })),
      ...expenses.map((expense) => ({
        id: expense.id,
        entryNumber: getEntryNumberFallback('EXP', expense.id),
        date: expense.date.toISOString(),
        direction: LedgerDirection.EXPENSE,
        source: 'PENGELUARAN',
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        referenceNumber: expense.receipt,
        notes: null,
        status: expense.status,
        origin: 'EXPENSE' as const,
      })),
      ...manualEntries.map((entry) => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        date: entry.date.toISOString(),
        direction: entry.direction,
        source: entry.source,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        referenceNumber: entry.referenceNumber,
        notes: entry.notes,
        status: 'RECORDED',
        origin: 'MANUAL' as const,
        paymentMethod: entry.createdBy ? `${entry.createdBy.nama} (${entry.createdBy.username})` : undefined,
      })),
    ];

    const filteredEntries = combinedEntries
      .filter((entry) => (direction === 'all' ? true : direction === 'income' ? entry.direction === 'INCOME' : entry.direction === 'EXPENSE'))
      .filter((entry) => matchesSearch(entry, search))
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

    const summary = buildSummary(filteredEntries);

    return NextResponse.json({
      success: true,
      data: {
        entries: filteredEntries,
        summary,
        filters: {
          period,
          month,
          year,
          direction,
          search,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data buku besar' },
      { status: 500 }
    );
  }
}

function generateEntryNumber(date: Date, count: number) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = String(count + 1).padStart(4, '0');

  return `LEDGER/${year}/${month}/${sequence}`;
}

export async function POST(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult.session;

  try {
    const body = await request.json();
    const direction = String(body.direction || '').toUpperCase() as LedgerDirection;
    const source = String(body.source || '').trim();
    const category = String(body.category || '').trim();
    const description = String(body.description || '').trim();
    const normalizedDescription = description || null;
    const referenceNumber = String(body.referenceNumber || '').trim();
    const notes = String(body.notes || '').trim();
    const dateInput = String(body.date || '');
    const amount = Number(body.amount);

    if (!['INCOME', 'EXPENSE'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'Arah transaksi harus pemasukan atau pengeluaran' },
        { status: 400 }
      );
    }

    if (!source || !category || !dateInput || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Data belum lengkap untuk menyimpan transaksi buku besar (arah, sumber, kategori, tanggal, nominal)' },
        { status: 400 }
      );
    }

    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Tanggal transaksi tidak valid' },
        { status: 400 }
      );
    }

    const entry = await prisma.$transaction(async (tx) => {
      const count = await tx.cashLedgerEntry.count({
        where: {
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), 1),
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
          },
        },
      });

      return tx.cashLedgerEntry.create({
        data: {
          entryNumber: generateEntryNumber(date, count),
          date,
          direction,
          source,
          category,
          description: normalizedDescription,
          amount,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          createdById: session.user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Transaksi buku besar berhasil disimpan',
    }, { status: 201 });
  } catch (error) {
    if (isCashLedgerSchemaMissing(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fitur input buku besar belum siap di database. Jalankan migrasi prisma terlebih dahulu.',
        },
        { status: 503 }
      );
    }

    console.error('Error creating ledger entry:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan transaksi buku besar' },
      { status: 500 }
    );
  }
}