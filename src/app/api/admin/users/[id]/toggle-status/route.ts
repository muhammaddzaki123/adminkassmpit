import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// PATCH - Toggle user status (active/inactive)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const { isActive } = body;
    const userId = params.id;

    // Validasi
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Status isActive harus boolean' },
        { status: 400 }
      );
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        username: true,
        nama: true,
        isActive: true,
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
