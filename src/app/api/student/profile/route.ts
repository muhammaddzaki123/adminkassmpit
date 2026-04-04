import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studentId: true },
    });

    if (!user || !user.studentId) {
      return NextResponse.json(
        { error: 'Unauthorized or student not found' },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: user.studentId },
      include: {
        studentClasses: {
          where: { isActive: true },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          include: {
            class: {
              select: {
                name: true,
                grade: true,
              },
            },
            academicYear: {
              select: {
                year: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const currentClass = student.studentClasses[0];

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        nama: student.nama,
        nisn: student.nisn,
        email: student.email,
        noTelp: student.noTelp,
        alamat: student.alamat,
        namaOrangTua: student.namaOrangTua,
        noTelpOrangTua: student.noTelpOrangTua,
        virtualAccount: student.virtualAccount,
        kelas: currentClass ? currentClass.class.name : '-',
        grade: currentClass ? currentClass.class.grade : null,
        academicYear: currentClass ? currentClass.academicYear.year : '-',
        status: student.status,
        enrollmentType: student.enrollmentType,
        birthPlace: student.birthPlace,
        birthDate: student.birthDate,
        gender: student.gender,
        religion: student.religion,
        admissionDate: student.admissionDate,
        graduationDate: student.graduationDate,
      },
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}
