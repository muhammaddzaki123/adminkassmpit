import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { reason } = body;

    // Update student status to REJECTED
    await prisma.student.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
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
