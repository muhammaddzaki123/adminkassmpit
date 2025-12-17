// This API is deprecated - use new Billing/Payment system instead
// File ini menggunakan model Transaction/SPPPayment yang sudah tidak digunakan lagi
// Gunakan /api/payment/webhook untuk payment gateway integration baru

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'This webhook endpoint is deprecated',
    message: 'Endpoint webhook ini sudah tidak digunakan. Sistem pembayaran baru menggunakan Billing/Payment model'
  }, { status: 410 }); // 410 Gone
}
