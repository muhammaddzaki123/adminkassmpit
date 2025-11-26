import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StudentStatus, PaymentStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (kelas && kelas !== 'all') {
      where.kelas = kelas;
    }

    if (status && status !== 'all') {
      where.status = status as StudentStatus;
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, nisn, kelas, status } = body;

    const student = await prisma.student.create({
      data: {
        nama,
        nisn,
        kelas,
        status: status || StudentStatus.ACTIVE,
        sppStatus: PaymentStatus.UNPAID,
        daftarUlangStatus: PaymentStatus.UNPAID,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
