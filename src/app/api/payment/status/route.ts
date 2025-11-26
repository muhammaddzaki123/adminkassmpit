import { NextRequest, NextResponse } from 'next/server';

// Simulate payment status check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    // In production, check status from payment gateway
    // For now, simulate random status
    const statuses = ['PENDING', 'PAID', 'FAILED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        status: randomStatus,
        paidAt: randomStatus === 'PAID' ? new Date().toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Check payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
