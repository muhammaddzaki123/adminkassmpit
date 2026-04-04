import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/academic-years/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(request);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can update academic years' }, { status: 403 });
    }

    const { id } = await params;
    const { year, startDate, endDate, isActive, description } = await request.json();

    const existing = await prisma.academicYear.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 404 });
    }

    if (isActive === true) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: {
        year: year ?? existing.year,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
        description: description !== undefined ? description : existing.description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tahun ajaran berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    return NextResponse.json(
      {
        error: 'Failed to update academic year',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/academic-years/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(request);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can delete academic years' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentClasses: true,
            billings: true,
            registrations: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 404 });
    }

    if (existing.isActive) {
      return NextResponse.json(
        { error: 'Tahun ajaran aktif tidak boleh dihapus. Aktifkan tahun ajaran lain terlebih dahulu.' },
        { status: 409 }
      );
    }

    const dependencyCount =
      existing._count.studentClasses + existing._count.billings + existing._count.registrations;

    if (dependencyCount > 0) {
      return NextResponse.json(
        {
          error:
            'Tahun ajaran tidak bisa dihapus karena sudah memiliki relasi data (kelas/siswa/tagihan/registrasi).',
        },
        { status: 409 }
      );
    }

    await prisma.academicYear.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Tahun ajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete academic year',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
