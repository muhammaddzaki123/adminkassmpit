import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireDashboardAccess } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        grade: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: classes.map((kelas) => ({
        id: kelas.id,
        value: kelas.id,
        label: `${kelas.grade} - ${kelas.name}`,
        grade: kelas.grade,
      })),
    });
  } catch (error) {
    console.error('Error fetching active classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active classes' },
      { status: 500 }
    );
  }
}
