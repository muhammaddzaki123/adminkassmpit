/**
 * WhatsApp Message Templates & Utilities
 * Using whatsapp-web.js as transport (FREE library)
 */

import { sendWhatsAppMessage as sendViaClient } from './whatsapp-client';

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
