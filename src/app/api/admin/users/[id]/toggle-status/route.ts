import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { logActivity } from '@/lib/activity-log';

// PATCH - Toggle user status (active/inactive) - ADMIN ONLY
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const adminSession = authResult.session;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    // Validasi
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Status isActive harus boolean' },
        { status: 400 }
      );
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        nama: true,
        isActive: true,
      },
    });

    await logActivity({
      userId: adminSession.user.id,
      action: 'TOGGLE_STATUS',
      entity: 'User',
      entityId: updatedUser.id,
      details: {
        target: updatedUser.username,
        message: `Mengubah status user ${updatedUser.username} menjadi ${isActive ? 'aktif' : 'non-aktif'}`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: `User berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah status user' },
      { status: 500 }
    );
  }
}
