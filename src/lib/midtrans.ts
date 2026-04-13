import crypto from 'crypto';

export type MidtransPaymentChannel = 'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET';

export interface MidtransChargeRequest {
  orderId: string;
  grossAmount: number;
  channel: MidtransPaymentChannel;
  bankCode?: string;
  customer: {
    firstName: string;
    email?: string | null;
    phone?: string | null;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customExpiryMinutes?: number;
}

export interface MidtransChargeResult {
  transactionId: string;
  orderId: string;
  transactionStatus: string;
  paymentType: string;
  expiryTime?: string;
  vaNumber?: string;
  qrCodeUrl?: string;
  deeplinkUrl?: string;
  raw: unknown;
}

export interface MidtransTransactionStatusResult {
  transactionId?: string;
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  settlementTime?: string;
  grossAmount?: string;
  raw: unknown;
}

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const apiUrl = isProduction
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }

  return { serverKey, apiUrl };
}

function getBasicAuthHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

function resolveChargePayload(input: MidtransChargeRequest) {
  const basePayload: Record<string, unknown> = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: Math.round(input.grossAmount),
    },
    customer_details: {
      first_name: input.customer.firstName,
      email: input.customer.email || undefined,
      phone: input.customer.phone || undefined,
    },
    item_details: input.itemDetails.map((item) => ({
      id: item.id,
      name: item.name,
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
  };

  if (input.customExpiryMinutes && input.customExpiryMinutes > 0) {
    basePayload.custom_expiry = {
      order_time: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' +0700',
      expiry_duration: input.customExpiryMinutes,
      unit: 'minute',
    };
  }

  if (input.channel === 'EWALLET') {
    return {
      ...basePayload,
      payment_type: 'qris',
      qris: {
        acquirer: 'gopay',
      },
    };
  }

  const bank = input.bankCode || process.env.MIDTRANS_DEFAULT_BANK || 'bca';

  return {
    ...basePayload,
    payment_type: 'bank_transfer',
    bank_transfer: {
      bank,
    },
  };
}

export async function createMidtransCharge(input: MidtransChargeRequest): Promise<MidtransChargeResult> {
  const { serverKey, apiUrl } = getMidtransConfig();
  const payload = resolveChargePayload(input);

  const response = await fetch(`${apiUrl}/charge`, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(serverKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.status_message || body?.error_messages?.join(', ') || 'Failed to create Midtrans charge');
  }

  const actions = Array.isArray(body.actions) ? body.actions : [];
  const qrAction = actions.find((action: { name?: string }) => action.name === 'generate-qr-code');
  const deeplinkAction = actions.find((action: { name?: string }) => action.name === 'deeplink-redirect');

  return {
    transactionId: String(body.transaction_id || input.orderId),
    orderId: String(body.order_id || input.orderId),
    transactionStatus: String(body.transaction_status || 'pending'),
    paymentType: String(body.payment_type || ''),
    expiryTime: body.expiry_time ? String(body.expiry_time) : undefined,
    vaNumber: body.va_numbers?.[0]?.va_number || body.permata_va_number || undefined,
    qrCodeUrl: body.qr_url || qrAction?.url || undefined,
    deeplinkUrl: deeplinkAction?.url || undefined,
    raw: body,
  };
}

export async function getMidtransTransactionStatus(orderId: string): Promise<MidtransTransactionStatusResult> {
  const { serverKey, apiUrl } = getMidtransConfig();

  const response = await fetch(`${apiUrl}/${orderId}/status`, {
    method: 'GET',
    headers: {
      Authorization: getBasicAuthHeader(serverKey),
      Accept: 'application/json',
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.status_message || body?.error_messages?.join(', ') || 'Failed to fetch Midtrans transaction status');
  }

  return {
    transactionId: body.transaction_id ? String(body.transaction_id) : undefined,
    orderId: String(body.order_id || orderId),
    transactionStatus: String(body.transaction_status || 'pending'),
    fraudStatus: body.fraud_status ? String(body.fraud_status) : undefined,
    settlementTime: body.settlement_time ? String(body.settlement_time) : undefined,
    grossAmount: body.gross_amount ? String(body.gross_amount) : undefined,
    raw: body,
  };
}

export function verifyMidtransSignature(payload: {
  orderId?: string;
  statusCode?: string;
  grossAmount?: string;
  signatureKey?: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  if (!payload.orderId || !payload.statusCode || !payload.grossAmount || !payload.signatureKey) return false;

  const source = `${payload.orderId}${payload.statusCode}${payload.grossAmount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(source).digest('hex');

  return expected === payload.signatureKey;
}

export function normalizeMidtransStatus(transactionStatus: string, fraudStatus?: string): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED' {
  const status = (transactionStatus || '').toLowerCase();
  const fraud = (fraudStatus || '').toLowerCase();

  if (status === 'capture') {
    return fraud === 'challenge' ? 'PROCESSING' : 'COMPLETED';
  }
  if (status === 'settlement') return 'COMPLETED';
  if (status === 'pending') return 'PENDING';
  if (status === 'deny' || status === 'cancel' || status === 'failure') return 'FAILED';
  if (status === 'expire') return 'EXPIRED';
  if (status === 'refund' || status === 'partial_refund' || status === 'chargeback' || status === 'partial_chargeback') return 'REFUNDED';
  if (status === 'authorize') return 'PROCESSING';

  return 'PENDING';
}
