import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, StudentStatus } from '@prisma/client';
import { requireDashboardAccess } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.StudentWhereInput = {};

    if (kelas && kelas !== 'all') {
      where.studentClasses = {
        some: {
          isActive: true,
          class: {
            name: kelas,
          },
        },
      };
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
      include: {
        studentClasses: {
          where: {
            isActive: true,
          },
          orderBy: {
            enrollmentDate: 'desc',
          },
          take: 1,
          include: {
            class: true,
            academicYear: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    const data = students.map((student) => {
      const currentClass = student.studentClasses[0];

      return {
        id: student.id,
        nama: student.nama,
        nisn: student.nisn,
        kelas: currentClass ? `${currentClass.class.name}` : '-',
        academicYear: currentClass ? currentClass.academicYear.year : '-',
        status: student.status,
        email: student.email,
        noTelp: student.noTelp,
        enrollmentType: student.enrollmentType,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch students' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireDashboardAccess(request);
  if (authResult instanceof NextResponse) return authResult;

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
