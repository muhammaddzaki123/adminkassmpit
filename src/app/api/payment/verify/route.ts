import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// POST /api/payment/verify - Treasurer verifies payment (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || session.user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurer can verify payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, action, notes, billingId, amount, method, paidAt, receiptUrl } = body;

    // Support both existing payment verification and manual payment creation
    if (billingId && amount) {
      // Manual payment creation
      const billing = await prisma.billing.findUnique({
        where: { id: billingId },
        include: { student: true },
      });

      if (!billing) {
        return NextResponse.json(
          { error: 'Billing not found' },
          { status: 404 }
        );
      }

      // Generate payment number
      const paymentCount = await prisma.payment.count();
      const paymentNumber = `PAY${new Date().getFullYear()}${String(paymentCount + 1).padStart(6, '0')}`;

      // Create payment directly as COMPLETED
      const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
          data: {
            paymentNumber,
            billing: {
              connect: { id: billingId }
            },
            amount,
            adminFee: 0,
            totalPaid: amount,
            method: method || 'TUNAI',
            status: 'COMPLETED',
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            notes: notes || `Manual payment by ${session.user.nama}`,
            receiptUrl,
            processedBy: {
              connect: { id: session.user.id }
            },
          },
        });

        // Update billing
        const newPaidAmount = billing.paidAmount + amount;
        const newStatus = newPaidAmount >= billing.totalAmount ? 'PAID' : 'PARTIAL';

        await tx.billing.update({
          where: { id: billingId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        return newPayment;
      });

      return NextResponse.json({
        success: true,
        data: { payment },
        message: 'Manual payment verified successfully',
      });
    }

    // Existing payment verification flow
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
