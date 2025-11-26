import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

interface Params {
  params: {
    id: string;
  };
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const { email, password, nama, role, isActive } = body;
    const userId = params.id;

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

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = params.id;

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
