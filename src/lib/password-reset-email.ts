import { getPasswordResetTtlMinutes } from '@/lib/password-reset';

interface PasswordResetTemplateData {
  nama: string;
  resetUrl: string;
}

export function createPasswordResetEmailTemplate(data: PasswordResetTemplateData): {
  subject: string;
  text: string;
  html: string;
} {
  const ttl = getPasswordResetTtlMinutes();

  const subject = 'Reset Password Portal Keuangan SMP IT ANAK SOLEH MATARAM';

  const text = [
    `Halo ${data.nama},`,
    '',
    'Kami menerima permintaan reset password untuk akun Portal Keuangan SMP IT ANAK SOLEH MATARAM.',
    `Silakan buka tautan berikut untuk membuat password baru: ${data.resetUrl}`,
    '',
    `Tautan hanya berlaku ${ttl} menit.`,
    'Jika Anda tidak merasa meminta reset password, abaikan email ini.',
    '',
    'Salam,',
    'Tim Sistem Keuangan SMP IT ANAK SOLEH MATARAM',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px; color: #1d4ed8;">Reset Password Portal Keuangan</h2>
      <p style="margin-top: 0; color: #334155;">SMP IT ANAK SOLEH MATARAM</p>
      <p>Halo <strong>${data.nama}</strong>,</p>
      <p>Kami menerima permintaan reset password untuk akun Anda. Silakan klik tombol berikut untuk membuat password baru.</p>
      <p style="margin: 24px 0;">
        <a href="${data.resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>Jika tombol tidak berfungsi, salin dan buka tautan berikut:</p>
      <p style="word-break: break-all; color: #1e40af;">${data.resetUrl}</p>
      <div style="margin-top: 20px; padding: 14px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe; font-size: 14px; color: #1e3a8a;">
        Tautan ini hanya berlaku <strong>${ttl} menit</strong> dan otomatis tidak dapat digunakan setelah password berhasil diubah.
      </div>
      <p style="margin-top: 20px; font-size: 14px; color: #475569;">Jika Anda tidak meminta reset password, abaikan email ini dan segera hubungi admin jika diperlukan.</p>
      <p style="margin-top: 28px;">Salam,<br /><strong>Tim Sistem Keuangan SMP IT ANAK SOLEH MATARAM</strong></p>
    </div>
  `;

  return { subject, text, html };
}

export function createPasswordResetSuccessEmailTemplate(nama: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = 'Password Berhasil Diperbarui';

  const text = [
    `Halo ${nama},`,
    '',
    'Password akun Anda di Portal Keuangan SMP IT ANAK SOLEH MATARAM telah berhasil diperbarui.',
    'Jika perubahan ini bukan dari Anda, segera hubungi admin sekolah.',
    '',
    'Salam,',
    'Tim Sistem Keuangan SMP IT ANAK SOLEH MATARAM',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px; color: #15803d;">Password Berhasil Diperbarui</h2>
      <p style="margin-top: 0; color: #334155;">SMP IT ANAK SOLEH MATARAM</p>
      <p>Halo <strong>${nama}</strong>,</p>
      <p>Password akun Anda telah berhasil diperbarui melalui fitur lupa password.</p>
      <div style="margin-top: 20px; padding: 14px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 14px; color: #166534;">
        Jika Anda tidak melakukan perubahan ini, segera hubungi admin sekolah untuk tindakan keamanan.
      </div>
      <p style="margin-top: 28px;">Salam,<br /><strong>Tim Sistem Keuangan SMP IT ANAK SOLEH MATARAM</strong></p>
    </div>
  `;

  return { subject, text, html };
}
