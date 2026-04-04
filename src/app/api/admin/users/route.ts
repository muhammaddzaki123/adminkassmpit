import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-helpers';
import { logActivity } from '@/lib/activity-log';

// GET - Fetch all users (ADMIN ONLY)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            email: true,
            nama: true,
          },
        },
        newStudent: {
          select: {
            email: true,
            nama: true,
          },
        },
      },
    });

    return NextResponse.json(users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.role === 'STUDENT' ? user.student?.email || null : user.role === 'NEW_STUDENT' ? user.newStudent?.email || null : user.email,
      nama: user.role === 'STUDENT' ? user.student?.nama || user.nama : user.role === 'NEW_STUDENT' ? user.newStudent?.nama || user.nama : user.nama,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}

// POST - Create new user (ADMIN ONLY)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const adminSession = authResult.session;

  try {
    const body = await request.json();
    const { username, email, password, nama, role, isActive } = body;

    // Validasi input
    if (!username || !password || !nama || !role) {
      return NextResponse.json(
        { error: 'Username, password, nama, dan role harus diisi' },
        { status: 400 }
      );
    }

    // Cek username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    const isStudentAccount = role === 'STUDENT' || role === 'NEW_STUDENT';

    // Cek email sudah ada (jika diisi dan bukan akun siswa)
    if (email && !isStudentAccount) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        username,
        email: isStudentAccount ? null : email || null,
        password: hashedPassword,
        nama,
        role,
        isActive: isActive ?? true,
      },
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
      action: 'CREATE_USER',
      entity: 'User',
      entityId: newUser.id,
      details: {
        target: newUser.username,
        message: `Membuat user ${newUser.username} dengan role ${newUser.role}`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dibuat',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Gagal membuat user' },
      { status: 500 }
    );
  }
}
