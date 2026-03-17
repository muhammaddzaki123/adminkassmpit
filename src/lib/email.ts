import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

export type EmailProvider = 'smtp' | 'resend' | 'sendgrid' | 'auto';

export interface TransactionalEmailPayload {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'smtp' | 'resend' | 'sendgrid' | 'none';
  messageId?: string;
  error?: string;
}

function normalizeProvider(raw: string): EmailProvider {
  const lowered = raw.toLowerCase();
  if (lowered === 'smtp' || lowered === 'resend' || lowered === 'sendgrid') {
    return lowered;
  }
  return 'auto';
}

async function getProvider(): Promise<EmailProvider> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'EMAIL_PROVIDER' },
      select: { value: true },
    });

    if (setting?.value) {
      return normalizeProvider(setting.value);
    }
  } catch {
    // Ignore DB failures and fallback to env/default.
  }

  return normalizeProvider(process.env.EMAIL_PROVIDER || 'auto');
}

function getSenderAddress(providerOverride?: 'smtp' | 'resend' | 'sendgrid'): string {
  if (providerOverride === 'resend' && process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }

  if (providerOverride === 'sendgrid' && process.env.SENDGRID_FROM_EMAIL) {
    return process.env.SENDGRID_FROM_EMAIL;
  }

  return process.env.EMAIL_FROM || 'noreply@smpit-mataram.local';
}

function canUseSmtp(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function canUseResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function canUseSendGrid(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

async function sendViaSmtp(payload: TransactionalEmailPayload): Promise<EmailSendResult> {
  if (!canUseSmtp()) {
    return {
      success: false,
      provider: 'smtp',
      error: 'SMTP configuration is incomplete',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: getSenderAddress('smtp'),
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'smtp',
      error: String(error),
    };
  }
}

async function sendViaResend(payload: TransactionalEmailPayload): Promise<EmailSendResult> {
  if (!canUseResend()) {
    return {
      success: false,
      provider: 'resend',
      error: 'RESEND_API_KEY is not set',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getSenderAddress('resend'),
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!response.ok) {
      return {
        success: false,
        provider: 'resend',
        error: body.message || `Resend API failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      provider: 'resend',
      messageId: body.id,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'resend',
      error: String(error),
    };
  }
}

async function sendViaSendGrid(payload: TransactionalEmailPayload): Promise<EmailSendResult> {
  if (!canUseSendGrid()) {
    return {
      success: false,
      provider: 'sendgrid',
      error: 'SENDGRID_API_KEY is not set',
    };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: getSenderAddress('sendgrid') },
        subject: payload.subject,
        content: [
          payload.text
            ? { type: 'text/plain', value: payload.text }
            : null,
          { type: 'text/html', value: payload.html },
        ].filter(Boolean),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        success: false,
        provider: 'sendgrid',
        error: message || `SendGrid API failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      provider: 'sendgrid',
      messageId: response.headers.get('x-message-id') || undefined,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'sendgrid',
      error: String(error),
    };
  }
}

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<EmailSendResult> {
  const configuredProvider = await getProvider();

  if (configuredProvider === 'smtp') {
    return sendViaSmtp(payload);
  }

  if (configuredProvider === 'resend') {
    return sendViaResend(payload);
  }

  if (configuredProvider === 'sendgrid') {
    return sendViaSendGrid(payload);
  }

  if (canUseSmtp()) {
    const smtpResult = await sendViaSmtp(payload);
    if (smtpResult.success) return smtpResult;
  }

  if (canUseResend()) {
    const resendResult = await sendViaResend(payload);
    if (resendResult.success) return resendResult;
  }

  if (canUseSendGrid()) {
    const sendGridResult = await sendViaSendGrid(payload);
    if (sendGridResult.success) return sendGridResult;
  }

  return {
    success: false,
    provider: 'none',
    error:
      'No email provider is available. Configure SMTP, Resend, or SendGrid credentials in environment variables.',
  };
}
