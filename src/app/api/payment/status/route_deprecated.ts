// This API is deprecated - use new Billing/Payment system instead
// File ini menggunakan model Transaction yang sudah tidak digunakan lagi
// Gunakan /api/payment/list dan /api/billing/list untuk sistem baru

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    error: 'This API is deprecated. Please use /api/payment/list for new payment system',
    message: 'API ini sudah tidak digunakan. Gunakan sistem Billing/Payment yang baru'
  }, { status: 410 }); // 410 Gone
}

export async function POST() {
  return NextResponse.json({
    error: 'This API is deprecated. Please use /api/payment/create for new payment system', 
    message: 'API ini sudah tidak digunakan. Gunakan sistem Billing/Payment yang baru'
  }, { status: 410 });
}
