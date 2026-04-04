import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { StudentStatus } from '@prisma/client';
import { logActivity } from '@/lib/activity-log';

type StudentDetail = {
  id: string;
  nama: string;
  nisn: string;
  noTelp: string | null;
  email: string | null;
  alamat: string | null;
  namaOrangTua: string | null;
  noTelpOrangTua: string | null;
  status: StudentStatus;
  virtualAccount: string | null;
  enrollmentType: string | null;
  admissionDate: Date;
  graduationDate: Date | null;
  birthPlace: string | null;
  birthDate: Date | null;
  gender: string | null;
  religion: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentClass: {
    classId: string;
    className: string;
    grade: number;
    academicYearId: string;
    academicYear: string;
    isActive: boolean;
  } | null;
  linkedAccount: {
    id: string;
    username: string;
    email: string | null;
    nama: string;
    role: string;
    isActive: boolean;
  } | null;
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            nama: true,
            role: true,
            isActive: true,
          },
        },
        studentClasses: {
          where: { isActive: true },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const currentClass = student.studentClasses[0];

    const payload: StudentDetail = {
      id: student.id,
      nama: student.nama,
      nisn: student.nisn,
      noTelp: student.noTelp,
      email: student.email,
      alamat: student.alamat,
      namaOrangTua: student.namaOrangTua,
      noTelpOrangTua: student.noTelpOrangTua,
      status: student.status,
      virtualAccount: student.virtualAccount,
      enrollmentType: student.enrollmentType,
      admissionDate: student.admissionDate,
      graduationDate: student.graduationDate,
      birthPlace: student.birthPlace,
      birthDate: student.birthDate,
      gender: student.gender,
      religion: student.religion,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      currentClass: currentClass
        ? {
            classId: currentClass.classId,
            className: currentClass.class.name,
            grade: currentClass.class.grade,
            academicYearId: currentClass.academicYearId,
            academicYear: currentClass.academicYear.year,
            isActive: currentClass.isActive,
          }
        : null,
      linkedAccount: student.user
        ? {
            id: student.user.id,
            username: student.user.username,
            email: student.user.email,
            nama: student.user.nama,
            role: student.user.role,
            isActive: student.user.isActive,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student detail' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const adminSession = authResult.session;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      nama,
      nisn,
      noTelp,
      email,
      alamat,
      namaOrangTua,
      noTelpOrangTua,
      status,
      virtualAccount,
      enrollmentType,
      admissionDate,
      graduationDate,
      birthPlace,
      birthDate,
      gender,
      religion,
      classId,
      academicYearId,
    } = body;

    if (!nama || !nisn || !status) {
      return NextResponse.json(
        { error: 'Nama, NISN, dan status harus diisi' },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const nisnConflict = await prisma.student.findFirst({
      where: {
        nisn,
        NOT: { id },
      },
    });

    if (nisnConflict) {
      return NextResponse.json(
        { error: 'NISN sudah digunakan oleh siswa lain' },
        { status: 400 }
      );
    }

    const classRecord = classId
      ? await prisma.class.findUnique({ where: { id: classId } })
      : null;

    if (classId && !classRecord) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 400 }
      );
    }

    const academicYearRecord = academicYearId
      ? await prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : null;

    if (academicYearId && !academicYearRecord) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 400 }
      );
    }

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: {
          nama,
          nisn,
          noTelp: noTelp || null,
          email: email || null,
          alamat: alamat || null,
          namaOrangTua: namaOrangTua || null,
          noTelpOrangTua: noTelpOrangTua || null,
          status: status as StudentStatus,
          virtualAccount: virtualAccount || null,
          enrollmentType: enrollmentType || null,
          admissionDate: admissionDate ? new Date(admissionDate) : existingStudent.admissionDate,
          graduationDate: graduationDate ? new Date(graduationDate) : null,
          birthPlace: birthPlace || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          gender: gender || null,
          religion: religion || null,
        },
      });

      if (existingStudent.user) {
        await tx.user.update({
          where: { id: existingStudent.user.id },
          data: {
            nama,
            email: email || null,
          },
        });
      }

      if (classId && academicYearId) {
        const existingEnrollment = await tx.studentClass.findFirst({
          where: {
            studentId: id,
            academicYearId,
          },
        });

        if (existingEnrollment) {
          await tx.studentClass.update({
            where: { id: existingEnrollment.id },
            data: {
              classId,
              isActive: true,
              endDate: null,
            },
          });
        } else {
          await tx.studentClass.create({
            data: {
              studentId: id,
              classId,
              academicYearId,
              isActive: true,
            },
          });
        }
      }

      return student;
    });

    await logActivity({
      userId: adminSession.user.id,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: updatedStudent.id,
      details: {
        target: updatedStudent.nama,
        message: `Memperbarui data siswa ${updatedStudent.nisn}`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student berhasil diupdate',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}