import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/classes/[id]/available-students
 * Get students not yet assigned to this class in current academic year
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: classId } = await params;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
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

    // Get IDs of students already in this class
    const assignedStudentIds = await prisma.studentClass.findMany({
      where: {
        classId,
        academicYearId: currentAcademicYear.id,
      },
      select: {
        studentId: true,
      },
    });

    const assignedIds = assignedStudentIds.map((a) => a.studentId);

    // Get active students not in this class
    const availableStudents = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        id: {
          notIn: assignedIds,
        },
      },
      select: {
        id: true,
        nama: true,
        nisn: true,
        status: true,
      },
      orderBy: {
        nama: 'asc',
      },
      take: 100, // Limit to prevent overwhelming large responses
    });

    return NextResponse.json(
      {
        success: true,
        data: availableStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET AVAILABLE STUDENTS ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat daftar siswa',
      },
      { status: 500 }
    );
  }
}
