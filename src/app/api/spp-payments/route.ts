import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (kelas && kelas !== 'all') {
      where.student = { kelas: kelas };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const payments = await prisma.sPPPayment.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch SPP payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, bulan, nominal, metodePembayaran, buktiTransfer } = body;

    const payment = await prisma.sPPPayment.create({
      data: {
        studentId,
        bulan,
        nominal: parseFloat(nominal),
        status: 'PENDING',
        metodePembayaran,
        buktiTransfer,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
