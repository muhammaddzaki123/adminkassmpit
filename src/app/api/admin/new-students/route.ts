import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: List all new students (calon siswa)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where = status ? { approvalStatus: status } : {};

    const newStudents = await prisma.newStudent.findMany({
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
    });

    return NextResponse.json({
      success: true,
      data: newStudents,
    });
  } catch (error) {
    console.error('Get new students error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memuat data' },
      { status: 500 }
    );
  }
}
