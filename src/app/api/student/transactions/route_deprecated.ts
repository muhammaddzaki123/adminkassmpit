// This API is deprecated - use new Billing/Payment system instead
// File ini menggunakan model Transaction yang sudah tidak digunakan lagi
// Gunakan /api/payment/list dengan filter studentId untuk riwayat pembayaran siswa

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    error: 'This API is deprecated. Please use /api/payment/list?studentId=xxx for payment history',
    message: 'API ini sudah tidak digunakan. Gunakan /api/payment/list untuk riwayat pembayaran'
  }, { status: 410 }); // 410 Gone
}
