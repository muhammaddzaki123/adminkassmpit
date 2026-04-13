import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import { appendPaymentAuditEvent, buildPaymentNotes } from '@/lib/payment-audit';

const PAYMENT_STATUS_VALUES: PaymentStatus[] = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'REFUNDED',
];

function resolveBillingStatus(totalAmount: number, paidAmount: number): 'PAID' | 'PARTIAL' {
  return paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
}

async function generateBillNumber(year: number, month: number | null) {
  const count = await prisma.billing.count({
    where: {
      year,
      month,
    },
  });

  if (month) {
    return `INV/${year}/${String(month).padStart(2, '0')}/${String(count + 1).padStart(4, '0')}`;
  }

  return `INV/${year}/00/${String(count + 1).padStart(4, '0')}`;
}

async function generatePaymentNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const lastPayment = await prisma.payment.findFirst({
    where: {
      paymentNumber: {
        startsWith: `PAY/${year}/${month}/`,
      },
    },
    orderBy: { paymentNumber: 'desc' },
  });

  let sequence = 1;
  if (lastPayment) {
    const parts = lastPayment.paymentNumber.split('/');
    sequence = parseInt(parts[3]) + 1;
  }

  return `PAY/${year}/${month}/${String(sequence).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const studentId = searchParams.get('studentId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      const statuses = status
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter((item): item is PaymentStatus => PAYMENT_STATUS_VALUES.includes(item as PaymentStatus));

      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (studentId) {
      where.billing = { studentId };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryOptions: any = {
      where,
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
        createdAt: 'desc',
      },
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = await prisma.payment.findMany(queryOptions) as any[];

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentType: payment.billing.type || 'SPP',
      amount: payment.amount,
      adminFee: payment.adminFee || 0,
      totalAmount: payment.amount + (payment.adminFee || 0),
      status: payment.status,
      paymentMethod: payment.method || 'VIRTUAL_ACCOUNT',
      student: {
        nama: payment.billing.student.nama,
        fullName: payment.billing.student.nama,
        nisn: payment.billing.student.nisn,
        nis: payment.billing.student.nisn,
        kelas: payment.billing.student.studentClasses?.[0]?.class?.name || '-',
      },
      month: payment.billing.month,
      year: payment.billing.year,
      description: payment.billing.description,
      notes: payment.notes,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPayments,
    });
  } catch (error) {
    console.error('Error fetching SPP payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      paymentType,
      amount,
      month,
      year,
      paidAt,
      description,
    } = body;

    if (!studentId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'studentId dan amount wajib diisi' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    const normalizedType = (paymentType || 'SPP').toUpperCase() as PaymentType;
    const normalizedYear = typeof year === 'number' ? year : new Date().getFullYear();
    const normalizedMonth = typeof month === 'number' ? month : null;

    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!academicYear) {
      return NextResponse.json(
        { success: false, error: 'Tahun ajaran aktif tidak ditemukan' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let billing = await tx.billing.findFirst({
        where: {
          studentId,
          type: normalizedType,
          month: normalizedMonth,
          year: normalizedYear,
          status: { in: ['BILLED', 'PARTIAL', 'OVERDUE'] },
        },
      });

      if (!billing) {
        const billNumber = await generateBillNumber(normalizedYear, normalizedMonth);
        const dueDate = new Date(normalizedYear, (normalizedMonth || 1) - 1, 10);

        billing = await tx.billing.create({
          data: {
            billNumber,
            studentId,
            academicYearId: academicYear.id,
            type: normalizedType,
            month: normalizedMonth,
            year: normalizedYear,
            subtotal: amount,
            discount: 0,
            totalAmount: amount,
            paidAmount: 0,
            status: 'BILLED',
            dueDate,
            billDate: new Date(),
            description: description || `Pembayaran ${normalizedType}`,
            issuedById: session.user.id,
          },
        });
      }

      const paymentNumber = await generatePaymentNumber();
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          billingId: billing.id,
          method: 'TUNAI' as PaymentMethod,
          amount,
          adminFee: 0,
          totalPaid: amount,
          status: 'COMPLETED',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          notes: buildPaymentNotes('COMPLETED'),
          auditPayload: appendPaymentAuditEvent(null, {
            source: 'manual-spp',
            status: 'COMPLETED',
            message: description || `Input manual bendahara oleh ${session.user.nama}`,
            raw: {
              studentId,
              paymentType: normalizedType,
              amount,
              month: normalizedMonth,
              year: normalizedYear,
              paidAt: paidAt || null,
              description: description || null,
            },
          }),
          processedById: session.user.id,
        },
      });

      const newPaidAmount = Math.min(billing.totalAmount, billing.paidAmount + amount);
      const nextStatus = resolveBillingStatus(billing.totalAmount, newPaidAmount);

      const updatedBilling = await tx.billing.update({
        where: { id: billing.id },
        data: {
          paidAmount: newPaidAmount,
          status: nextStatus,
        },
      });

      await tx.paymentDetail.create({
        data: {
          paymentId: payment.id,
          description: description || `Pembayaran ${normalizedType}`,
          amount,
        },
      });

      return { payment, billing: updatedBilling };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.payment.id,
        paymentNumber: result.payment.paymentNumber,
        status: result.payment.status,
        billingStatus: result.billing.status,
      },
    });
  } catch (error) {
    console.error('Error creating SPP payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
