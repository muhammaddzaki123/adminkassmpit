import * as jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || 'password-reset-secret';
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || '30');

interface PasswordResetPayload {
  type: 'password-reset';
  userId: string;
  fingerprint: string;
}

export function getPasswordFingerprint(userId: string, passwordHash: string): string {
  return createHash('sha256')
    .update(`${userId}:${passwordHash}:${PASSWORD_RESET_SECRET}`)
    .digest('hex');
}

export function createPasswordResetToken(userId: string, passwordHash: string): string {
  const payload: PasswordResetPayload = {
    type: 'password-reset',
    userId,
    fingerprint: getPasswordFingerprint(userId, passwordHash),
  };

  return jwt.sign(payload, PASSWORD_RESET_SECRET, {
    expiresIn: `${PASSWORD_RESET_TTL_MINUTES}m`,
  });
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  const decoded = jwt.verify(token, PASSWORD_RESET_SECRET) as PasswordResetPayload;

  if (!decoded || decoded.type !== 'password-reset' || !decoded.userId || !decoded.fingerprint) {
    throw new Error('Token reset password tidak valid');
  }

  return decoded;
}

export function getPasswordResetTtlMinutes(): number {
  return PASSWORD_RESET_TTL_MINUTES;
}
