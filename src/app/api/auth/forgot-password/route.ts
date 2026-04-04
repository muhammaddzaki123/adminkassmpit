import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPasswordResetToken, getPasswordResetTtlMinutes } from '@/lib/password-reset';
import { sendTransactionalEmail } from '@/lib/email';
import { createPasswordResetEmailTemplate } from '@/lib/password-reset-email';

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
        role: true,
        student: {
          select: {
            email: true,
          },
        },
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

    const recipientEmail = user.role === 'STUDENT' ? user.student?.email || user.email : user.email;

    const emailTemplate = createPasswordResetEmailTemplate({
      nama: user.nama,
      resetUrl,
    });

    const emailResult = await sendTransactionalEmail({
      to: recipientEmail || user.username,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        recipient: recipientEmail || user.username,
        type: 'EMAIL',
        status: emailResult.success ? 'SENT' : 'FAILED',
        subject: emailTemplate.subject,
        content: emailTemplate.text,
        template: 'password-reset',
        metadata: JSON.stringify({
          resetUrl,
          username: user.username,
          expiresInMinutes: getPasswordResetTtlMinutes(),
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          error: emailResult.error,
        }),
        sentAt: emailResult.success ? new Date() : undefined,
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Tautan reset dibuat (mode pengembangan).',
        debugResetUrl: resetUrl,
        emailDelivery: {
          success: emailResult.success,
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          error: emailResult.error,
        },
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
