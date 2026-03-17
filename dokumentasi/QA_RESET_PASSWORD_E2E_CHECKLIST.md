# QA Checklist - Reset Password E2E

Tanggal eksekusi: 2026-03-17
Aplikasi: Portal Keuangan SMP IT ANAK SOLEH MATARAM
Lingkungan uji: lokal (http://localhost:3000)
Akun uji: superadmin

## Script Yang Dijalankan

- Perintah: npm run qa:reset-e2e
- File script: scripts/qa-reset-password-e2e.mjs

## Hasil Eksekusi

- Status akhir: PASS
- Ringkasan output:
  - PASS Forgot Password Request #1
  - PASS Extract Token #1
  - PASS Expired Token Rejected
  - PASS Reset Password To Temporary
  - PASS Token Reuse Rejected
  - PASS Login With Temporary Password
  - PASS Forgot Password Request #2
  - PASS Extract Token #2
  - PASS Restore Original Password
  - PASS Final Login Verification

## Checklist QA Manual End-to-End

- [x] Endpoint forgot-password menerima identifier valid
- [x] Sistem menghasilkan tautan reset token (mode non-production)
- [x] Token reset yang kedaluwarsa ditolak sistem (status 400)
- [x] Endpoint reset-password menerima token dan mengganti password
- [x] Token reset tidak dapat dipakai ulang setelah password berubah (status 400)
- [x] Login berhasil dengan password sementara hasil reset
- [x] Flow reset kedua berjalan untuk rollback password awal
- [x] Login akhir berhasil dengan password awal (state akun kembali normal)
- [x] Tidak ada crash server saat proses berurutan

## Catatan Validasi Tambahan

- Lint project: PASS (npm run lint)
- Build production: belum dijalankan ulang setelah batch perubahan terakhir
- Pengiriman email reset kini sudah terhubung provider nyata (SMTP/Resend/SendGrid) dengan fallback otomatis
- Log notifikasi menyimpan status delivery (SENT/FAILED), provider, messageId, dan error

## Rekomendasi UAT Lanjutan

- Uji setiap provider email secara terpisah:
  - SMTP dengan kredensial valid
  - Resend dengan RESEND_API_KEY dan RESEND_FROM_EMAIL
  - SendGrid dengan SENDGRID_API_KEY dan SENDGRID_FROM_EMAIL
- Uji deliverability inbox nyata (SPF/DKIM/DMARC) sebelum produksi
