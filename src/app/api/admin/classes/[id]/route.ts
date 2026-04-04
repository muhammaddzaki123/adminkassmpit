import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/classes/[id] - update class
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(request);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can update classes' }, { status: 403 });
    }

    const { id } = await params;
    const { name, grade, sppAmount, maxCapacity, description } = await request.json();

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    const normalizedName = String(name ?? existing.name).trim();
    const parsedGrade = Number(grade ?? existing.grade);

    if (!normalizedName || Number.isNaN(parsedGrade)) {
      return NextResponse.json(
        { error: 'Nama kelas dan tingkat kelas tidak valid' },
        { status: 400 }
      );
    }

    const duplicate = await prisma.class.findFirst({
      where: {
        id: { not: id },
        name: normalizedName,
        grade: parsedGrade,
        isActive: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Kelas dengan nama dan tingkat yang sama sudah ada' },
        { status: 409 }
      );
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name: normalizedName,
        grade: parsedGrade,
        sppAmount: sppAmount !== undefined ? Number(sppAmount) : existing.sppAmount,
        maxCapacity: maxCapacity !== undefined ? Number(maxCapacity) : existing.maxCapacity,
        description: description !== undefined ? description : existing.description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      {
        error: 'Failed to update class',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/classes/[id] - soft delete class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(request);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can delete classes' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentClasses: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (existing._count.studentClasses > 0) {
      return NextResponse.json(
        {
          error: `Kelas tidak bisa dihapus karena masih dipakai ${existing._count.studentClasses} siswa aktif`,
        },
        { status: 409 }
      );
    }

    await prisma.class.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete class',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
