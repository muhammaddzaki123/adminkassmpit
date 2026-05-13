import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

interface BulkAssignPayload {
  studentIds: string[];
  classId: string;
  academicYearId: string;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body: BulkAssignPayload = await req.json();
    const { studentIds, classId, academicYearId } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { message: 'Pilih minimal 1 siswa' },
        { status: 400 }
      );
    }

    if (!classId || !academicYearId) {
      return NextResponse.json(
        { message: 'Kelas dan tahun ajaran harus dipilih' },
        { status: 400 }
      );
    }

    // Validate class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return NextResponse.json(
        { message: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYearExists) {
      return NextResponse.json(
        { message: 'Tahun ajaran tidak ditemukan' },
        { status: 404 }
      );
    }

    // Bulk assign
    let successCount = 0;
    const errors: { studentId: string; error: string }[] = [];

    for (const studentId of studentIds) {
      try {
        // Check if student exists
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          errors.push({ studentId, error: 'Siswa tidak ditemukan' });
          continue;
        }

        // Check if student already in this class for this academic year
        const existing = await prisma.studentClass.findUnique({
          where: {
            studentId_academicYearId: {
              studentId,
              academicYearId,
            },
          },
        });

        if (existing) {
          // Update existing enrollment to point to new class
          await prisma.studentClass.update({
            where: { id: existing.id },
            data: {
              classId,
              isActive: true,
              endDate: null,
            },
          });
        } else {
          // Create new enrollment
          await prisma.studentClass.create({
            data: {
              studentId,
              classId,
              academicYearId,
              isActive: true,
            },
          });
        }

        successCount++;
      } catch (error) {
        errors.push({
          studentId,
          error: error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} siswa berhasil di-assign ke kelas`,
      data: {
        successCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Bulk assign error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat assign kelas massal' },
      { status: 500 }
    );
  }
}
