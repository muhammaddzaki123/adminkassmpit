import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;

    // Update student status to ACTIVE
    const student = await prisma.student.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        admissionDate: new Date(),
      },
    });

    // ✅ IMPORTANT: Change role from NEW_STUDENT → STUDENT and activate
    await prisma.user.updateMany({
      where: { studentId: id },
      data: { 
        role: 'STUDENT',  // ✅ Upgrade to STUDENT role
        isActive: true     // ✅ Activate account
      },
    });

    return NextResponse.json({
      message: 'Siswa berhasil disetujui dan dapat login sebagai STUDENT',
      student,
    });
  } catch (error) {
    console.error('Error approving student:', error);
    return NextResponse.json(
      { message: 'Gagal menyetujui siswa' },
      { status: 500 }
    );
  }
}
