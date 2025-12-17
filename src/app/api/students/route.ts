import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StudentStatus } from '@prisma/client';
import { requireDashboardAccess } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const authResult = await requireDashboardAccess();
  if (authResult instanceof NextResponse) return authResult;

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

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch students' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, nisn, status } = body;

    const student = await prisma.student.create({
      data: {
        nama,
        nisn,
        status: status || StudentStatus.ACTIVE,
        enrollmentType: 'CONTINUING',
      },
    });

    return NextResponse.json({
      success: true,
      data: student,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create student' 
    }, { status: 500 });
  }
}
