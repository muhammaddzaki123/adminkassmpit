import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// GET - Fetch all users
export async function GET() {
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
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
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

    // Cek email sudah ada (jika diisi)
    if (email) {
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
        email: email || null,
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
