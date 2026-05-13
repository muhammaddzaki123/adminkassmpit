import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/admin/classes/[id]/remove-member/[memberId]
 * Remove a student from a class
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: classId, memberId: studentId } = await params;

    if (!classId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Class ID and Member ID are required' },
        { status: 400 }
      );
    }

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentAcademicYear) {
      return NextResponse.json(
        { success: false, error: 'Tahun ajaran aktif tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if student is in this class
    const studentClass = await prisma.studentClass.findUnique({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId: currentAcademicYear.id,
        },
      },
      include: {
        student: true,
      },
    });

    if (!studentClass || studentClass.classId !== classId) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan di kelas ini' },
        { status: 404 }
      );
    }

    // Remove student from class (soft delete or hard delete based on your preference)
    await prisma.studentClass.update({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId: currentAcademicYear.id,
        },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${studentClass.student.nama} berhasil dihapus dari kelas`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[REMOVE CLASS MEMBER ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus anggota kelas',
      },
      { status: 500 }
    );
  }
}
