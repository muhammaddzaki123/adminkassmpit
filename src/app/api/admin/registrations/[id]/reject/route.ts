import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    // Update student status to REJECTED
    await prisma.student.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        approvalStatus: 'REJECTED',
      },
    });

    // Deactivate user account
    await prisma.user.updateMany({
      where: { studentId: id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: 'Pendaftaran ditolak',
      reason,
    });
  } catch (error) {
    console.error('Error rejecting student:', error);
    return NextResponse.json(
      { message: 'Gagal menolak pendaftaran' },
      { status: 500 }
    );
  }
}
