import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// POST /api/payment/create - Create payment for a billing (PROPER FLOW)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session || !['STUDENT', 'TREASURER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { billingId, amount, method, receiptUrl, notes } = await request.json();

    // Validate
    if (!billingId || !amount || !method) {
      return NextResponse.json(
        { error: 'Billing ID, amount, and method are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get billing
    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }

    // Authorization: student can only pay their own billing
    if (session.user.role === 'STUDENT') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (user?.studentId !== billing.studentId) {
        return NextResponse.json(
          { error: 'Unauthorized to pay this billing' },
          { status: 403 }
        );
      }
    }

    // Check billing status
    if (billing.status === 'PAID') {
      return NextResponse.json(
        { error: 'Billing already paid' },
        { status: 400 }
      );
    }

    if (billing.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Billing is cancelled' },
        { status: 400 }
      );
    }

    // Calculate remaining amount
    const remainingAmount = billing.totalAmount - billing.paidAmount;

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance (Rp ${remainingAmount.toLocaleString('id-ID')})` },
        { status: 400 }
      );
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber();

    // Calculate admin fee
    let adminFee = 0;
    if (method === 'VIRTUAL_ACCOUNT') {
      adminFee = 2500;
    } else if (method === 'EWALLET') {
      adminFee = Math.ceil(amount * 0.007); // 0.7%
    }

    const totalPaid = amount + adminFee;

    // TUNAI must be processed by treasurer
    const paymentStatus = method === 'TUNAI' ? 'COMPLETED' : 'PENDING';
    
    if (method === 'TUNAI' && session.user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Cash payments must be processed by treasurer' },
        { status: 403 }
      );
    }

    // Create payment in transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          paymentNumber,
          billing: {
            connect: { id: billingId }
          },
          method,
          amount,
          adminFee,
          totalPaid,
          status: paymentStatus,
          notes,
          receiptUrl,
          paidAt: paymentStatus === 'COMPLETED' ? new Date() : null,
          ...(session.user.role === 'TREASURER' && {
            processedBy: {
              connect: { id: session.user.id }
            }
          }),
        },
      });

      // Create payment details
      await tx.paymentDetail.create({
        data: {
          paymentId: newPayment.id,
          description: billing.description || `Pembayaran ${billing.type}`,
          amount: amount,
        },
      });

      if (adminFee > 0) {
        await tx.paymentDetail.create({
          data: {
            paymentId: newPayment.id,
            description: 'Biaya Admin',
            amount: adminFee,
          },
        });
      }

      // If TUNAI, update billing immediately
      if (paymentStatus === 'COMPLETED') {
        const newPaidAmount = billing.paidAmount + amount;
        const newStatus = newPaidAmount >= billing.totalAmount ? 'PAID' : 'PARTIAL';

        await tx.billing.update({
          where: { id: billingId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      return newPayment;
    });

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          adminFee: payment.adminFee,
          totalPaid: payment.totalPaid,
          status: payment.status,
          method: payment.method,
        },
        message: payment.status === 'COMPLETED' 
          ? 'Payment completed successfully' 
          : 'Payment created. Please complete payment via your chosen method.',
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create payment', details: errorMessage },
      { status: 500 }
    );
  }
}

async function generatePaymentNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const lastPayment = await prisma.payment.findFirst({
    where: {
      paymentNumber: {
        startsWith: `PAY/${year}/${month}/`,
      },
    },
    orderBy: { paymentNumber: 'desc' },
  });

  let sequence = 1;
  if (lastPayment) {
    const parts = lastPayment.paymentNumber.split('/');
    sequence = parseInt(parts[3]) + 1;
  }

  return `PAY/${year}/${month}/${String(sequence).padStart(4, '0')}`;
}
