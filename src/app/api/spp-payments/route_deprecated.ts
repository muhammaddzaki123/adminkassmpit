// This API is deprecated - use new Billing/Payment system instead
// File ini menggunakan model SPPPayment yang sudah tidak digunakan lagi
// Gunakan /api/billing/student untuk melihat tagihan SPP

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    error: 'This API is deprecated. Please use /api/billing/student for new billing system',
    message: 'API ini sudah tidak digunakan. Gunakan /api/billing/student untuk sistem tagihan baru'
  }, { status: 410 }); // 410 Gone
}

export async function POST() {
  return NextResponse.json({
    error: 'This API is deprecated. Please use /api/payment/create for new payment system',
    message: 'API ini sudah tidak digunakan. Gunakan /api/payment/create untuk pembayaran baru'
  }, { status: 410 });
}
