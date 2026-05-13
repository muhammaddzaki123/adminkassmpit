import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/classes/[id]/members
 * Get all students in a specific class
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

    // Get students in this class for current academic year
    const members = await prisma.studentClass.findMany({
      where: {
        classId,
        academicYearId: currentAcademicYear.id,
        isActive: true,
      },
      select: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            status: true,
          },
        },
      },
      orderBy: {
        student: {
          nama: 'asc',
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: members.map((m) => ({
          id: m.student.id,
          nama: m.student.nama,
          nisn: m.student.nisn,
          status: m.student.status,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET CLASS MEMBERS ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat anggota kelas',
      },
      { status: 500 }
    );
  }
}
