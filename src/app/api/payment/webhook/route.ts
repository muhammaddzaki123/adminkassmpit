import { NextRequest, NextResponse } from 'next/server';

// Webhook endpoint for payment gateway callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status, paidAt } = body;

    // Verify webhook signature in production
    // Update transaction status in database
    
    console.log('Payment webhook received:', { transactionId, status, paidAt });

    // Update transaction status
    // await prisma.transaction.update({
    //   where: { externalId: transactionId },
    //   data: { status, paidAt: paidAt ? new Date(paidAt) : null }
    // });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
