import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification, getSettings } from '@/lib/notification';

// Webhook endpoint for payment gateway callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalId, status, paidAt, paymentType } = body;

    console.log('📥 Payment webhook received:', { externalId, status, paidAt, paymentType });

    // TODO: Verify webhook signature in production
    // const signature = request.headers.get('x-webhook-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { externalId },
      include: {
        student: {
          include: {
            users: true // Get linked parent users
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { externalId },
      data: {
        status,
        paidAt: status === 'PAID' && paidAt ? new Date(paidAt) : null,
        updatedAt: new Date()
      }
    });

    console.log('✅ Transaction updated:', updatedTransaction.id);

    // Only process if payment is successful
    if (status === 'PAID') {
      await handleSuccessfulPayment(transaction, updatedTransaction);
    } else if (status === 'FAILED') {
      await handleFailedPayment(transaction);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(
  transaction: {
    id: string;
    studentId: string;
    paymentType: string;
    amount: number;
    bulan?: string | null;
    tahunAjaran?: string | null;
    student: {
      id: string;
      nama: string;
      nisn: string;
      kelas: string;
      email?: string | null;
      noTelp?: string | null;
      namaOrangTua?: string | null;
      users: Array<{ id: string; email?: string | null; username: string }>;
    };
  },
  updatedTransaction: { paidAt: Date | null }
) {
  const { student, paymentType } = transaction;

  // Get auto-approval setting
  const autoApprovalEnabled = await getSettings('AUTO_APPROVAL');

  switch (paymentType) {
    case 'SPP':
      await handleSPPPayment(transaction, updatedTransaction);
      break;
    
    case 'DAFTAR_ULANG':
      await handleReRegistrationPayment(student, autoApprovalEnabled === 'true');
      break;
    
    case 'LAINNYA':
      // Check if this is a registration payment
      if (student.status === 'PENDING_REGISTRATION' || student.approvalStatus === 'PENDING') {
        await handleRegistrationPayment(student, autoApprovalEnabled === 'true');
      }
      break;
  }

  // Send payment success notification
  const parentUser = student.users[0]; // Get first parent account
  if (parentUser && (student.email || student.noTelp)) {
    await sendNotification(
      {
        email: student.email || undefined,
        phone: student.noTelp || undefined,
        userId: parentUser.id
      },
      'payment-success',
      {
        nama: student.nama,
        paymentType: getPaymentTypeName(paymentType),
        amount: amount,
        paidAt: updatedTransaction.paidAt?.toLocaleString('id-ID') || new Date().toLocaleString('id-ID'),
        transactionId: transaction.id
      }
    );
  }

  console.log(`✅ ${paymentType} payment processed for student ${student.nama}`);
}

async function handleSPPPayment(
  transaction: {
    id: string;
    studentId: string;
    amount: number;
    bulan?: string | null;
    tahunAjaran?: string | null;
    paymentMethod: string;
  },
  updatedTransaction: { paidAt: Date | null }
) {
  if (!transaction.bulan || !transaction.tahunAjaran) {
    console.warn('⚠️  Missing bulan or tahunAjaran for SPP payment');
    return;
  }

  // Create or update SPP payment record
  const sppPayment = await prisma.sPPPayment.upsert({
    where: {
      studentId_bulan_tahunAjaran: {
        studentId: transaction.studentId,
        bulan: transaction.bulan,
        tahunAjaran: transaction.tahunAjaran
      }
    },
    create: {
      studentId: transaction.studentId,
      bulan: transaction.bulan,
      tahunAjaran: transaction.tahunAjaran,
      nominal: transaction.amount,
      status: 'PAID',
      tanggalBayar: updatedTransaction.paidAt,
      metodePembayaran: transaction.paymentMethod,
      transactionId: transaction.id,
      autoRecorded: true,
      recordedAt: new Date(),
      paymentMethod: transaction.paymentMethod as never
    },
    update: {
      status: 'PAID',
      tanggalBayar: updatedTransaction.paidAt,
      transactionId: transaction.id,
      autoRecorded: true,
      recordedAt: new Date()
    }
  });

  console.log('✅ SPP payment auto-recorded:', sppPayment.id);

  // Update student SPP status
  await prisma.student.update({
    where: { id: transaction.studentId },
    data: { sppStatus: 'PAID' }
  });
}

async function handleReRegistrationPayment(
  student: {
    id: string;
    nama: string;
    email?: string | null;
    noTelp?: string | null;
  },
  autoApprove: boolean
) {
  // Update student re-registration status
  const updateData: {
    daftarUlangStatus: string;
    status?: string;
    approvalStatus?: string;
    approvedAt?: Date;
  } = {
    daftarUlangStatus: 'PAID'
  };

  if (autoApprove) {
    updateData.status = 'ACTIVE';
    updateData.approvalStatus = 'APPROVED';
    updateData.approvedAt = new Date();
  }

  await prisma.student.update({
    where: { id: student.id },
    data: updateData
  });

  console.log(`✅ Re-registration processed for ${student.nama}, auto-approved: ${autoApprove}`);
}

async function handleRegistrationPayment(
  student: {
    id: string;
    nama: string;
    nisn: string;
    kelas: string;
    email?: string | null;
    noTelp?: string | null;
    users: Array<{ id: string; email?: string | null; username: string }>;
  },
  autoApprove: boolean
) {
  // Update student registration status
  const updateData: {
    registrationPaid: boolean;
    status?: string;
    approvalStatus?: string;
    approvedAt?: Date;
    approvedBy?: string;
  } = {
    registrationPaid: true
  };

  if (autoApprove) {
    updateData.status = 'ACTIVE';
    updateData.approvalStatus = 'APPROVED';
    updateData.approvedAt = new Date();
    updateData.approvedBy = 'SYSTEM_AUTO';
  }

  await prisma.student.update({
    where: { id: student.id },
    data: updateData
  });

  console.log(`✅ Registration payment processed for ${student.nama}, auto-approved: ${autoApprove}`);

  // Send approval notification if auto-approved
  if (autoApprove) {
    const parentUser = student.users[0];
    if (parentUser && (student.email || student.noTelp)) {
      await sendNotification(
        {
          email: student.email || undefined,
          phone: student.noTelp || undefined,
          userId: parentUser.id
        },
        'registration-approved',
        {
          nama: student.nama,
          nisn: student.nisn,
          username: parentUser.username,
          kelas: student.kelas
        }
      );
    }
  }
}

async function handleFailedPayment(
  transaction: {
    studentId: string;
    student: {
      nama: string;
      email?: string | null;
      noTelp?: string | null;
      users: Array<{ id: string }>;
    };
  }
) {
  console.log(`⚠️  Payment failed for student ${transaction.student.nama}`);
  
  // TODO: Send failure notification
  // You can implement retry logic or manual intervention notification here
}

function getPaymentTypeName(type: string): string {
  const types: Record<string, string> = {
    'SPP': 'SPP Bulanan',
    'DAFTAR_ULANG': 'Daftar Ulang',
    'LAINNYA': 'Lainnya'
  };
  return types[type] || type;
}

