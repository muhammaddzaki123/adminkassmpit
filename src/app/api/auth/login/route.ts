import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan username - optimized query (select only needed fields)
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        nama: true,
        email: true,
        role: true,
        isActive: true,
        studentId: true,
        newStudentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Validasi user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Validasi user active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Validasi role jika dipilih saat login
    if (role && role !== 'STUDENT' && user.role !== role) {
      return NextResponse.json(
        { error: 'Role tidak sesuai dengan akun Anda' },
        { status: 403 }
      );
    }

    // Create JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      studentId: user.studentId,
      newStudentId: user.newStudentId,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Return user data (tanpa password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: userWithoutPassword,
      token,
    });

    // Set token in HTTP-only cookie
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
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
