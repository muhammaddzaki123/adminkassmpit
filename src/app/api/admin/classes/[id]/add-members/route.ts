import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/classes/[id]/add-members
 * Add multiple students to a class
 */
export async function POST(
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

    const body = await req.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs array is required' },
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

    // Check class capacity
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        studentClasses: {
          where: {
            academicYearId: currentAcademicYear.id,
            isActive: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentCount = classData.studentClasses.length;
    const maxCapacity = classData.maxCapacity || 999;

    if (currentCount >= maxCapacity) {
      return NextResponse.json(
        { success: false, error: `Kelas sudah penuh (${currentCount}/${maxCapacity})` },
        { status: 400 }
      );
    }

    const availableSlots = maxCapacity - currentCount;
    const toAdd = studentIds.slice(0, availableSlots);

    // Add students to class
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.studentClass.createMany({
        data: toAdd.map((studentId) => ({
          studentId,
          classId,
          academicYearId: currentAcademicYear.id,
          isActive: true,
        })),
        skipDuplicates: true, // Skip if already exists
      });

      return created.count;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          addedCount: result,
          skippedCount: studentIds.length - result,
        },
        message: `${result} siswa berhasil ditambahkan`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADD CLASS MEMBERS ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambah anggota kelas',
      },
      { status: 500 }
    );
  }
}
