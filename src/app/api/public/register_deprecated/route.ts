import { NextResponse } from 'next/server';

// DEPRECATED FILE - Transaction model has been removed from schema
// This endpoint no longer works as Transaction model has been deleted
// Please use the new system with Billing and Payment models

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Transaction model has been removed.',
      message: 'Please use the new student registration system with NewStudent model.'
    },
    { status: 410 } // 410 Gone
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Transaction model has been removed.',
      message: 'Please use /api/billing endpoints instead.'
    },
    { status: 410 }
  );
}
