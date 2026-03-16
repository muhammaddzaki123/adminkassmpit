import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPasswordResetToken, getPasswordResetTtlMinutes } from '@/lib/password-reset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Username atau email wajib diisi' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        password: true,
        isActive: true,
      },
    });

    const genericResponse = NextResponse.json({
      success: true,
      message: 'Jika akun ditemukan, tautan reset password akan dikirim.',
    });

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const token = createPasswordResetToken(user.id, user.password);
    const resetPath = `/auth/reset-password?token=${encodeURIComponent(token)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resetUrl = `${appUrl}${resetPath}`;

    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        recipient: user.email || user.username,
        type: 'EMAIL',
        status: 'SENT',
        subject: 'Reset Password T-SMART',
        content: `Halo ${user.nama},\n\nSilakan reset password akun Anda melalui tautan berikut:\n${resetUrl}\n\nTautan berlaku ${getPasswordResetTtlMinutes()} menit.\n\nJika Anda tidak meminta reset password, abaikan pesan ini.`,
        template: 'password-reset',
        metadata: JSON.stringify({
          resetUrl,
          username: user.username,
          expiresInMinutes: getPasswordResetTtlMinutes(),
        }),
        sentAt: new Date(),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Tautan reset dibuat (mode pengembangan).',
        debugResetUrl: resetUrl,
      });
    }

    return genericResponse;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
