import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { StudentStatus } from '@prisma/client';

// PATCH - Update student status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { session } = authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, reason } = body;

    // Validate status
    if (!status || !Object.values(StudentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student status
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        status: status as StudentStatus
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_STUDENT_STATUS',
        entity: 'Student',
        entityId: id,
        details: JSON.stringify({
          oldStatus: student.status,
          newStatus: status,
          reason
        })
      }
    });

    return NextResponse.json({ 
      message: 'Student status updated successfully',
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json(
      { error: 'Failed to update student status' },
      { status: 500 }
    );
  }
}
