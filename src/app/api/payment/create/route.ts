import { NextRequest, NextResponse } from 'next/server';

// Simulated payment gateway API
// In production, integrate with Xendit, Midtrans, or other payment gateway

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, paymentType, amount, paymentMethod } = body;

    if (!studentId || !paymentType || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `TRX${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Generate Virtual Account number (simulation)
    let vaNumber = null;
    let expiredAt = null;
    
    if (paymentMethod === 'VIRTUAL_ACCOUNT') {
      // Format: 88888 + 10 digit unique number
      vaNumber = `88888${studentId.substring(0, 5)}${Date.now().toString().slice(-5)}`;
      // Expired in 24 hours
      expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Admin fee simulation
    const adminFee = paymentMethod === 'VIRTUAL_ACCOUNT' ? 4000 : 
                     paymentMethod === 'EWALLET' ? 2500 : 0;
    const totalAmount = amount + adminFee;

    // Create transaction record
    const transaction = {
      id: transactionId,
      studentId,
      paymentType,
      paymentMethod,
      amount,
      adminFee,
      totalAmount,
      status: 'PENDING',
      externalId: `EXT${transactionId}`,
      vaNumber,
      expiredAt: expiredAt?.toISOString(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
