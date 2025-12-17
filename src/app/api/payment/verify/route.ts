import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// POST /api/payment/verify - Treasurer verifies payment (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurer can verify payments' },
        { status: 403 }
      );
    }

    const { paymentId, action, notes } = await request.json();

    // Validate
    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'Payment ID and action are required' },
        { status: 400 }
      );
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        billing: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment already verified' },
        { status: 400 }
      );
    }

    if (payment.status === 'FAILED' || payment.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Payment is already failed or refunded' },
        { status: 400 }
      );
    }

    // Update payment and billing in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: action === 'APPROVE' ? 'COMPLETED' : 'FAILED',
          paidAt: action === 'APPROVE' ? new Date() : null,
          processedById: session.user.id,
          notes: notes || payment.notes,
        },
      });

      // If approved, update billing
      if (action === 'APPROVE') {
        const billing = payment.billing;
        const newPaidAmount = billing.paidAmount + payment.amount;
        const newStatus = newPaidAmount >= billing.totalAmount ? 'PAID' : 'PARTIAL';

        await tx.billing.update({
          where: { id: billing.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      return updatedPayment;
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: result.id,
        status: result.status,
        action,
        paidAt: result.paidAt,
      },
      message: action === 'APPROVE' 
        ? 'Payment verified and approved successfully' 
        : 'Payment rejected',
    });
  } catch (error) {
    console.error('Verify payment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to verify payment', details: errorMessage },
      { status: 500 }
    );
  }
}
