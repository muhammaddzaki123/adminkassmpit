import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getPasswordFingerprint, verifyPasswordResetToken } from '@/lib/password-reset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body?.token || '').trim();
    const newPassword = String(body?.newPassword || '');
    const confirmPassword = String(body?.confirmPassword || '');

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, password baru, dan konfirmasi password wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Konfirmasi password tidak cocok' },
        { status: 400 }
      );
    }

    let decoded: { userId: string; fingerprint: string };
    try {
      decoded = verifyPasswordResetToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Token reset password tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        password: true,
        isActive: true,
        email: true,
        username: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    const currentFingerprint = getPasswordFingerprint(user.id, user.password);
    if (currentFingerprint !== decoded.fingerprint) {
      return NextResponse.json(
        { error: 'Token sudah tidak berlaku. Silakan minta tautan reset baru.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        recipient: user.email || user.username,
        type: 'EMAIL',
        status: 'SENT',
        subject: 'Password Berhasil Diperbarui',
        content: 'Password akun Anda telah berhasil diperbarui melalui fitur lupa password.',
        template: 'password-reset-success',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Silakan login menggunakan password baru.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
