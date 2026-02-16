import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/admin/classes - Get all classes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || !['TREASURER', 'ADMIN', 'HEADMASTER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { grade: 'asc' },
        { name: 'asc' },
      ],
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

    return NextResponse.json({
      success: true,
      data: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        sppAmount: cls.sppAmount,
        maxCapacity: cls.maxCapacity,
        currentStudents: cls._count.studentClasses,
        waliKelas: cls.waliKelas,
      })),
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/classes - Create new class
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admin can create classes' },
        { status: 403 }
      );
    }

    const { name, grade, sppAmount, maxCapacity, waliKelas, description } = await request.json();

    if (!name || !grade) {
      return NextResponse.json(
        { error: 'Name and grade are required' },
        { status: 400 }
      );
    }

    const cls = await prisma.class.create({
      data: {
        name,
        grade: parseInt(grade),
        sppAmount: parseFloat(sppAmount || 0),
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : 40,
        waliKelas,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      data: cls,
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
