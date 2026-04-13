import { Prisma } from '@prisma/client';

type PaymentAuditEvent = {
  source: 'create' | 'sync' | 'webhook' | 'manual-verify' | 'manual-spp';
  status: string;
  message?: string;
  raw: Prisma.InputJsonValue;
  recordedAt: string;
};

type PaymentAuditPayload = {
  updatedAt: string;
  events: PaymentAuditEvent[];
};

function isPaymentAuditPayload(value: unknown): value is PaymentAuditPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as PaymentAuditPayload;
  return Array.isArray(payload.events) && typeof payload.updatedAt === 'string';
}

export function buildPaymentNotes(status: string): string {
  return `Status akhir: ${status}`;
}

export function appendPaymentAuditEvent(
  existing: unknown,
  event: Omit<PaymentAuditEvent, 'recordedAt'>,
): Prisma.InputJsonValue {
  const now = new Date().toISOString();
  const current = isPaymentAuditPayload(existing)
    ? existing
    : { updatedAt: now, events: [] as PaymentAuditEvent[] };

  return {
    updatedAt: now,
    events: [
      ...current.events,
      {
        ...event,
        recordedAt: now,
      },
    ],
  } as Prisma.InputJsonValue;
}
