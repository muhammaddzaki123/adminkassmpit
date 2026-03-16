import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-helpers';
import { logActivity } from '@/lib/activity-log';

// PUT - Update user (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const adminSession = authResult.session;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { email, password, nama, role, isActive } = body;
    const userId = id;

    // Validasi input
    if (!nama || !role) {
      return NextResponse.json(
        { error: 'Nama dan role harus diisi' },
        { status: 400 }
      );
    }

    // Cek user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek email conflict (jika diubah)
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      nama,
      role,
      isActive: isActive ?? true,
    };

    if (email) {
      updateData.email = email;
    }

    // Hash password baru jika diisi
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: adminSession.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: updatedUser.id,
      details: {
        target: updatedUser.username,
        message: `Memperbarui data user ${updatedUser.username}`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil diupdate',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const adminSession = authResult.session;

  try {
    const { id } = await context.params;
    const userId = id;

    // Cek user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus user
    await prisma.user.delete({
      where: { id: userId },
    });

    await logActivity({
      userId: adminSession.user.id,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: userId,
      details: {
        target: existingUser.username,
        message: `Menghapus user ${existingUser.username}`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    );
  }
}
