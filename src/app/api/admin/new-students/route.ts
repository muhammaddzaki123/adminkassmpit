import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

// GET: List all new students (calon siswa) - ADMIN ONLY
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const skip = (page - 1) * limit;

    const where = status ? { approvalStatus: status } : {};

    const [newStudents, total] = await Promise.all([
      prisma.newStudent.findMany({
        where,
        orderBy: { registrationDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              isActive: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.newStudent.count({ where }),
    ]);

    const activeCount = await prisma.newStudent.count({
      where: { ...(status ? { approvalStatus: status } : {}), approvalStatus: 'APPROVED' },
    });

    const rejectedCount = await prisma.newStudent.count({
      where: { ...(status ? { approvalStatus: status } : {}), approvalStatus: 'REJECTED' },
    });

    const pendingCount = await prisma.newStudent.count({
      where: { ...(status ? { approvalStatus: status } : {}), approvalStatus: 'PENDING' },
    });

    return NextResponse.json({
      success: true,
      data: newStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        pendingCount,
        activeCount,
        rejectedCount,
      },
    });
  } catch (error) {
    console.error('Get new students error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memuat data' },
      { status: 500 }
    );
  }
}
