import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;

if (!midtransServerKey) {
  throw new Error('MIDTRANS_SERVER_KEY is not configured');
}

function buildSignature({ orderId, statusCode, grossAmount, serverKey }) {
  const source = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash('sha512').update(source).digest('hex');
}

async function main() {
  try {
    const billing = await prisma.billing.findFirst({
      where: {
        status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!billing) {
      throw new Error('Tidak ada billing aktif (BILLED/OVERDUE/PARTIAL) untuk dites.');
    }

    if (!billing.student?.user) {
      throw new Error('Billing ditemukan tapi tidak punya user STUDENT terkait.');
    }

    const remaining = billing.totalAmount - billing.paidAmount;
    if (remaining <= 0) {
      throw new Error('Billing tidak punya sisa pembayaran.');
    }

    const amount = Math.min(remaining, 10000);

    const token = jwt.sign(
      {
        id: billing.student.user.id,
        username: billing.student.user.username,
        nama: billing.student.user.nama,
        role: billing.student.user.role,
        studentId: billing.student.user.studentId,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const createResp = await fetch(`${baseUrl}/api/payment/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingId: billing.id,
        amount,
        method: 'VIRTUAL_ACCOUNT',
        notes: 'E2E simulation payment flow',
      }),
    });

    const createJson = await createResp.json();

    if (!createResp.ok || !createJson?.success) {
      throw new Error(`Create payment gagal: ${JSON.stringify(createJson)}`);
    }

    const createdPayment = createJson.data.payment;
    const orderId = createdPayment.externalId;
    const grossAmount = String(createdPayment.totalPaid);
    const statusCode = '200';
    const transactionId = `SIM-${Date.now()}`;

    const signatureKey = buildSignature({
      orderId,
      statusCode,
      grossAmount,
      serverKey: midtransServerKey,
    });

    const webhookPayload = {
      transaction_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      transaction_status: 'settlement',
      transaction_id: transactionId,
      status_message: 'midtrans payment notification',
      status_code: statusCode,
      signature_key: signatureKey,
      order_id: orderId,
      payment_type: 'bank_transfer',
      gross_amount: grossAmount,
      settlement_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      fraud_status: 'accept',
    };

    const webhookResp = await fetch(`${baseUrl}/api/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookJson = await webhookResp.json();

    if (!webhookResp.ok || !webhookJson?.success) {
      throw new Error(`Webhook gagal: ${JSON.stringify(webhookJson)}`);
    }

    const finalPayment = await prisma.payment.findUnique({
      where: { id: createdPayment.id },
      include: {
        billing: true,
      },
    });

    if (!finalPayment) {
      throw new Error('Payment hasil create tidak ditemukan saat verifikasi akhir.');
    }

    const output = {
      scenario: 'create -> webhook settlement -> verify db',
      student: {
        id: billing.student.id,
        nama: billing.student.nama,
        nisn: billing.student.nisn,
      },
      billingBefore: {
        id: billing.id,
        status: billing.status,
        totalAmount: billing.totalAmount,
        paidAmount: billing.paidAmount,
      },
      createdPayment: {
        id: createdPayment.id,
        paymentNumber: createdPayment.paymentNumber,
        externalId: createdPayment.externalId,
        amount: createdPayment.amount,
        adminFee: createdPayment.adminFee,
        totalPaid: createdPayment.totalPaid,
        status: createdPayment.status,
      },
      webhookResult: webhookJson,
      paymentAfter: {
        id: finalPayment.id,
        paymentNumber: finalPayment.paymentNumber,
        status: finalPayment.status,
        transactionId: finalPayment.transactionId,
        paidAt: finalPayment.paidAt,
      },
      billingAfter: {
        id: finalPayment.billing.id,
        status: finalPayment.billing.status,
        totalAmount: finalPayment.billing.totalAmount,
        paidAmount: finalPayment.billing.paidAmount,
      },
      assertions: {
        paymentCompleted: finalPayment.status === 'COMPLETED',
        billingUpdated: finalPayment.billing.paidAmount > billing.paidAmount,
        billingConsistent:
          finalPayment.billing.status ===
          (finalPayment.billing.paidAmount >= finalPayment.billing.totalAmount ? 'PAID' : 'PARTIAL'),
      },
    };

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
