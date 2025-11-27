import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { nisn, password } = await request.json();

    // Validasi input
    if (!nisn || !password) {
      return NextResponse.json(
        { error: 'NISN dan password harus diisi' },
        { status: 400 }
      );
    }

    // Cari calon siswa berdasarkan NISN
    const newStudent = await prisma.newStudent.findUnique({
      where: { nisn },
      include: {
        user: true,
      },
    });

    if (!newStudent || !newStudent.user) {
      return NextResponse.json(
        { error: 'NISN atau password salah' },
        { status: 401 }
      );
    }

    // Verifikasi role harus NEW_STUDENT
    if (newStudent.user.role !== 'NEW_STUDENT') {
      return NextResponse.json(
        { error: 'Akun ini bukan akun calon siswa' },
        { status: 403 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, newStudent.user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'NISN atau password salah' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!newStudent.user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif. Hubungi admin.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newStudent.user.id,
        newStudentId: newStudent.id,
        role: 'NEW_STUDENT',
        nisn: newStudent.nisn,
        nama: newStudent.nama,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: newStudent.user.id,
        username: newStudent.user.username,
        nama: newStudent.nama,
        role: 'NEW_STUDENT',
        nisn: newStudent.nisn,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
