import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/admin/academic-years - Get all academic years
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !['TREASURER', 'ADMIN', 'HEADMASTER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            studentClasses: true,
            billings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: academicYears.map(ay => ({
        id: ay.id,
        year: ay.year,
        startDate: ay.startDate,
        endDate: ay.endDate,
        isActive: ay.isActive,
        description: ay.description,
        studentCount: ay._count.studentClasses,
        billingCount: ay._count.billings,
      })),
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic years', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/academic-years - Create new academic year
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admin can create academic years' },
        { status: 403 }
      );
    }

    const { year, startDate, endDate, isActive, description } = await request.json();

    if (!year || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Year, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
        description,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Academic year created successfully',
      data: academicYear,
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    return NextResponse.json(
      { error: 'Failed to create academic year', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
