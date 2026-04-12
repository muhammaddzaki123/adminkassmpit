/**
 * WhatsApp Message Templates & Utilities
 * Using whatsapp-web.js as transport (FREE library)
 */

import { sendWhatsAppMessage as sendViaClient } from './whatsapp-client';
import prisma from './prisma';

interface WhatsAppMessageOptions {
  to: string; // Nomor tujuan (format: +62... atau 0812...)
  body: string; // Pesan text
  template?: "payment_success" | "payment_reminder" | "payment_overdue";
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

type ReminderTemplateType = 'payment_reminder' | 'payment_overdue';

type ReminderTemplateData = {
  studentName: string;
  amount: number;
  billingType: string;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
};

const TEMPLATE_SETTING_KEYS: Record<ReminderTemplateType, string> = {
  payment_reminder: 'WA_TEMPLATE_PAYMENT_REMINDER',
  payment_overdue: 'WA_TEMPLATE_PAYMENT_OVERDUE',
};

/**
 * Format currency to Rupiah
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Send WhatsApp message via whatsapp-web.js
 */
export async function sendWhatsAppMessage(
  options: WhatsAppMessageOptions
): Promise<WhatsAppResponse> {
  try {
    const { to, body } = options;

    // Validate inputs
    if (!to || to.trim().length === 0) {
      return {
        success: false,
        error: "Phone number tidak boleh kosong",
      };
    }

    if (!body || body.trim().length === 0) {
      return {
        success: false,
        error: "Pesan tidak boleh kosong",
      };
    }

    // Send via whatsapp-web.js
    const result = await sendViaClient(to, body);

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      status: result.success ? 'sent' : 'failed',
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim pesan",
    };
  }
}

/**
 * Format pesan pembayaran berhasil
 */
export function getPaymentSuccessMessage(data: {
  studentName: string;
  amount: number;
  billingType: string;
  paymentMethod: string;
  transactionId?: string;
}): string {
  return `Halo ${data.studentName},

✅ *PEMBAYARAN DITERIMA*

Kami telah menerima pembayaran Anda dengan baik.

📋 *Detail Pembayaran:*
• Jenis Tagihan: ${data.billingType}
• Jumlah: ${formatRupiah(data.amount)}
• Metode: ${data.paymentMethod}
${data.transactionId ? `• Nomor Transaksi: ${data.transactionId}` : ""}

Terima kasih telah melakukan pembayaran tepat waktu.

Hubungi sekolah jika ada pertanyaan.

Salam,
*Sistem KASSMPIT*`;
}

/**
 * Format pesan reminder pembayaran
 */
export function getPaymentReminderMessage(data: {
  studentName: string;
  amount: number;
  billingType: string;
  dueDate: string;
  daysUntilDue?: number;
}): string {
  const timeLeft =
    data.daysUntilDue && data.daysUntilDue > 1
      ? `${data.daysUntilDue} hari lagi`
      : data.daysUntilDue === 1
      ? 'besok'
      : 'sudah lewat';

  return `Halo ${data.studentName},

⏰ *PENGINGAT PEMBAYARAN*

Anda memiliki tagihan yang perlu dibayar segera.

📋 *Detail Tagihan:*
• Jenis: ${data.billingType}
• Jumlah: ${formatRupiah(data.amount)}
• Jatuh Tempo: ${data.dueDate} (${timeLeft})
• Status: ⏳ Belum dibayar

📍 Silakan segera lakukan pembayaran untuk menghindari denda keterlambatan.

Hubungi bendahara jika ada kendala pembayaran.

Salam,
*Sistem KASSMPIT*`;
}

/**
 * Format pesan pembayaran telah jatuh tempo
 */
export function getPaymentOverdueMessage(data: {
  studentName: string;
  amount: number;
  billingType: string;
  dueDate: string;
  daysOverdue: number;
}): string {
  return `Halo ${data.studentName},

⚠️ *PEMBAYARAN TERLAMBAT*

Pembayaran Anda telah *${data.daysOverdue} hari* melewati tanggal jatuh tempo.

📋 *Detail Tagihan:*
• Jenis: ${data.billingType}
• Jumlah: ${formatRupiah(data.amount)}
• Jatuh Tempo: ${data.dueDate}
• Status: 🔴 TERLAMBAT

⚡ *TINDAKAN SEGERA DIPERLUKAN:*
Mohon segera lakukan pembayaran hari ini untuk menghindari konsekuensi lebih lanjut.

📞 Hubungi bendahara sekarang untuk bantuan pembayaran.

Salam,
*Sistem KASSMPIT*`;
}

function applyTemplatePlaceholders(template: string, data: ReminderTemplateData) {
  const daysUntilDue = typeof data.daysUntilDue === 'number' ? data.daysUntilDue : null;
  const daysOverdue = typeof data.daysOverdue === 'number' ? data.daysOverdue : null;
  const timeLeft =
    daysUntilDue !== null && daysUntilDue > 1
      ? `${daysUntilDue} hari lagi`
      : daysUntilDue === 1
        ? 'besok'
        : daysUntilDue === 0
          ? 'hari ini'
          : 'sudah lewat';

  const map: Record<string, string> = {
    '{{studentName}}': data.studentName,
    '{{amount}}': formatRupiah(data.amount),
    '{{billingType}}': data.billingType,
    '{{dueDate}}': data.dueDate,
    '{{daysUntilDue}}': daysUntilDue !== null ? String(daysUntilDue) : '-',
    '{{daysOverdue}}': daysOverdue !== null ? String(daysOverdue) : '-',
    '{{timeLeft}}': timeLeft,
  };

  let result = template;
  for (const [key, value] of Object.entries(map)) {
    result = result.split(key).join(value);
  }

  return result;
}

async function getTemplateFromSettings(type: ReminderTemplateType): Promise<string | null> {
  try {
    const key = TEMPLATE_SETTING_KEYS[type];
    const setting = await prisma.systemSettings.findUnique({
      where: { key },
      select: { value: true },
    });

    if (!setting?.value || setting.value.trim().length === 0) {
      return null;
    }

    return setting.value;
  } catch (error) {
    console.error('Failed to load WhatsApp template setting:', error);
    return null;
  }
}

export async function getCustomizableReminderMessage(
  type: ReminderTemplateType,
  data: ReminderTemplateData
): Promise<string> {
  const customTemplate = await getTemplateFromSettings(type);

  if (customTemplate) {
    return applyTemplatePlaceholders(customTemplate, data);
  }

  if (type === 'payment_overdue') {
    return getPaymentOverdueMessage({
      studentName: data.studentName,
      amount: data.amount,
      billingType: data.billingType,
      dueDate: data.dueDate,
      daysOverdue: data.daysOverdue || 0,
    });
  }

  return getPaymentReminderMessage({
    studentName: data.studentName,
    amount: data.amount,
    billingType: data.billingType,
    dueDate: data.dueDate,
    daysUntilDue: data.daysUntilDue,
  });
}
