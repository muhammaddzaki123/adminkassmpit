import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface SessionUser {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  studentId?: string;
  newStudentId?: string;
}

export interface Session {
  user: SessionUser;
}

/**
 * Get server session from JWT token in Authorization header or cookies
 */
export async function getServerSession(request?: NextRequest): Promise<Session | null> {
  if (!request) {
    return null;
  }

  try {
    // Prefer cookie token to avoid stale Authorization header from old localStorage values.
    const cookieToken = request.cookies.get('token')?.value || null;

    // Fallback token from Authorization header.
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (cookieToken) {
      token = cookieToken;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return null;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;

    return {
      user: decoded,
    };
  } catch (error) {
    // Stale/invalid token is expected after secret changes or expired sessions.
    if (
      error instanceof Error &&
      ((error as { name?: string }).name === 'JsonWebTokenError' ||
        (error as { name?: string }).name === 'TokenExpiredError')
    ) {
      return null;
    }

    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null, roles: UserRole[]): boolean {
  if (!session?.user?.role) {
    return false;
  }
  return roles.includes(session.user.role);
}
