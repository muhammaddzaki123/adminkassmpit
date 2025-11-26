import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    // Mock transaction history
    const transactions = [
      {
        id: 'TRX001',
        paymentType: 'SPP',
        amount: 500000,
        adminFee: 4000,
        totalAmount: 504000,
        status: 'PAID',
        paymentMethod: 'VIRTUAL_ACCOUNT',
        description: 'Pembayaran SPP Januari 2025',
        paidAt: '2025-01-15T10:30:00Z',
        createdAt: '2025-01-15T08:00:00Z',
      },
      {
        id: 'TRX002',
        paymentType: 'SPP',
        amount: 500000,
        adminFee: 4000,
        totalAmount: 504000,
        status: 'PENDING',
        paymentMethod: 'VIRTUAL_ACCOUNT',
        vaNumber: '8888812345678901',
        description: 'Pembayaran SPP Februari 2025',
        expiredAt: '2025-02-01T23:59:59Z',
        createdAt: '2025-01-28T14:20:00Z',
      },
      {
        id: 'TRX003',
        paymentType: 'DAFTAR_ULANG',
        amount: 2000000,
        adminFee: 4000,
        totalAmount: 2004000,
        status: 'PAID',
        paymentMethod: 'TRANSFER_BANK',
        description: 'Daftar Ulang TA 2025/2026',
        paidAt: '2024-12-20T15:45:00Z',
        createdAt: '2024-12-20T13:00:00Z',
      },
    ];

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
