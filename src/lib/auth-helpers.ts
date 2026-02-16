// src/lib/auth-helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from './auth';
import { UserRole } from '@prisma/client';

/**
 * Check if user is authenticated and has required role
 * Returns session if authorized, throws NextResponse error if not
 */
export async function requireAuth(request: NextRequest, allowedRoles: UserRole[]) {
  const session = await getServerSession(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }
  
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    return NextResponse.json(
      { error: `Forbidden - Requires role: ${allowedRoles.join(' or ')}` },
      { status: 403 }
    );
  }
  
  return { session };
}

/**
 * Check if user is ADMIN only
 */
export async function requireAdmin(request: NextRequest) {
  return requireAuth(request, ['ADMIN']);
}

/**
 * Check if user is TREASURER only
 */
export async function requireTreasurer(request: NextRequest) {
  return requireAuth(request, ['TREASURER']);
}

/**
 * Check if user is ADMIN or TREASURER
 */
export async function requireAdminOrTreasurer(request: NextRequest) {
  return requireAuth(request, ['ADMIN', 'TREASURER']);
}

/**
 * Check if user is HEADMASTER only
 */
export async function requireHeadmaster(request: NextRequest) {
  return requireAuth(request, ['HEADMASTER']);
}

/**
 * Check if user has read-only dashboard access
 */
export async function requireDashboardAccess(request: NextRequest) {
  return requireAuth(request, ['ADMIN', 'TREASURER', 'HEADMASTER']);
}

/**
 * Check if user is STUDENT only
 */
export async function requireStudent(request: NextRequest) {
  return requireAuth(request, ['STUDENT']);
}

/**
 * Check if user is NEW_STUDENT only
 */
export async function requireNewStudent(request: NextRequest) {
  return requireAuth(request, ['NEW_STUDENT']);
}
