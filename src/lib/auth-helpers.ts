// src/lib/auth-helpers.ts
import { NextResponse } from 'next/server';
import { getServerSession } from './auth';
import { UserRole } from '@prisma/client';

/**
 * Check if user is authenticated and has required role
 * Returns session if authorized, throws NextResponse error if not
 */
export async function requireAuth(allowedRoles: UserRole[]) {
  const session = await getServerSession();
  
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
export async function requireAdmin() {
  return requireAuth(['ADMIN']);
}

/**
 * Check if user is TREASURER only
 */
export async function requireTreasurer() {
  return requireAuth(['TREASURER']);
}

/**
 * Check if user is ADMIN or TREASURER
 */
export async function requireAdminOrTreasurer() {
  return requireAuth(['ADMIN', 'TREASURER']);
}

/**
 * Check if user is HEADMASTER only
 */
export async function requireHeadmaster() {
  return requireAuth(['HEADMASTER']);
}

/**
 * Check if user has read-only dashboard access
 */
export async function requireDashboardAccess() {
  return requireAuth(['ADMIN', 'TREASURER', 'HEADMASTER']);
}

/**
 * Check if user is STUDENT only
 */
export async function requireStudent() {
  return requireAuth(['STUDENT']);
}

/**
 * Check if user is NEW_STUDENT only
 */
export async function requireNewStudent() {
  return requireAuth(['NEW_STUDENT']);
}
