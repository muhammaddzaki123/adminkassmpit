import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSettings } from '@/lib/notification';

// Payment gateway API - Creates real transaction in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, paymentType, amount, paymentMethod, bulan, tahunAjaran, description } = body;

    if (!studentId || !paymentType || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `TRX${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Generate Virtual Account number if needed
    let vaNumber = null;
    let expiredAt = null;
    
    if (paymentMethod === 'VIRTUAL_ACCOUNT') {
      // Format: 88888 + student ID substring + timestamp
      vaNumber = `88888${studentId.replace(/-/g, '').substring(0, 5)}${Date.now().toString().slice(-5)}`;
      
      // Get expiry hours from settings or default to 24
      const expiryHours = await getSettings('PAYMENT_EXPIRY_HOURS');
      const hours = expiryHours ? parseInt(expiryHours) : 24;
      expiredAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Calculate admin fee based on payment method
    const adminFee = paymentMethod === 'VIRTUAL_ACCOUNT' ? 4000 : 
                     paymentMethod === 'EWALLET' ? 2500 : 0;
    const totalAmount = amount + adminFee;

    // Create transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        studentId,
        paymentType: paymentType as 'SPP' | 'DAFTAR_ULANG' | 'LAINNYA',
        paymentMethod: paymentMethod as 'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | 'TUNAI',
        amount,
        adminFee,
        totalAmount,
        status: 'PENDING',
        externalId: transactionId,
        vaNumber,
        expiredAt,
        description: description || `Pembayaran ${paymentType}`,
        bulan,
        tahunAjaran
      }
    });

    console.log('✅ Transaction created:', transaction.id);

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        externalId: transaction.externalId,
        studentId: transaction.studentId,
        paymentType: transaction.paymentType,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        adminFee: transaction.adminFee,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
        vaNumber: transaction.vaNumber,
        expiredAt: transaction.expiredAt?.toISOString(),
        createdAt: transaction.createdAt.toISOString()
      },
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
