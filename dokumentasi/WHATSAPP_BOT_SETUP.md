# 📱 WhatsApp Bot Integration Guide

## Overview

Sistem WhatsApp Bot untuk KASSMPIT memungkinkan pengiriman notifikasi pembayaran otomatis dan reminder pembayaran kepada siswa dan orang tua melalui WhatsApp.

### Fitur Utama

1. **✅ Notifikasi Pembayaran Sukses** - Otomatis saat pembayaran diverifikasi
2. **⏰ Reminder Pembayaran** - Manual trigger dari bendahara atau scheduled otomatis
3. **⚠️ Alert Pembayaran Telat** - Notifikasi otomatis untuk siswa yang overdue
4. **📋 Tracking & Logging** - Semua pesan tercatat di `NotificationLog`

---

## 1. Setup Twilio WhatsApp

### Step 1: Create Twilio Account

1. Buka [https://www.twilio.com/console](https://www.twilio.com/console)
2. Sign up atau login dengan akun Twilio Anda
3. Verifikasi nomor telepon Anda

### Step 2: Enable WhatsApp Sandbox

1. Di Twilio Console, pilih **Messaging** > **Try it out** > **Send an SMS**
2. Pilih **Start with Programmable Messaging** atau buka **Messaging** > **Services**
3. Buka **Integrations** > **WhatsApp**
4. Klik **Get Started with the WhatsApp Sandbox**
5. Ikuti instruksi untuk:
   - Verify nomor telepon Twilio untuk WhatsApp
   - Set webhook URLs untuk incoming messages (optional untuk reminder use case)

### Step 3: Get Credentials

Di Twilio Console, kumpulkan:

- **TWILIO_ACCOUNT_SID** - Account ID Anda
- **TWILIO_AUTH_TOKEN** - Auth token untuk API calls
- **TWILIO_WHATSAPP_FROM** - Nomor WhatsApp sandbox (format: `whatsapp:+62...`)

### Step 4: Get Credentials for Live

Untuk production, Anda perlu:

1. Request approval dari Twilio untuk WhatsApp Business Account
2. Connect nomor telepon bisnis Anda
3. Update `TWILIO_WHATSAPP_FROM` dengan nomor live

---

## 2. Environment Configuration

### Update `.env` lokal

```bash
# WhatsApp Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_token_here"
TWILIO_WHATSAPP_FROM="whatsapp:+62812345678"

# Cron Secret untuk scheduled reminders
CRON_SECRET="your_secure_secret"
```

### Generate CRON_SECRET

```bash
# macOS / Linux
openssl rand -hex 32

# Windows (PowerShell)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## 3. Database Migration

Jalankan migration untuk add `lastReminderSentAt` field ke Billing model:

```bash
npx prisma db push
```

Atau buat migration baru:

```bash
npx prisma migrate dev --name add_whatsapp_reminder_tracking
```

---

## 4. API Endpoints

### A. Send WhatsApp Message (Internal)

**Endpoint:** `POST /api/whatsapp/send`

**Body:**
```json
{
  "to": "+62812345678",
  "body": "Pesan WhatsApp Anda",
  "template": "payment_success"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM1234567890abcdef",
  "status": "queued"
}
```

---

### B. Manual Payment Reminder (Bendahara)

**Endpoint:** `POST /api/whatsapp/send-reminder`

**Permission:** TREASURER or ADMIN

**Body Options:**

**Option 1: Send to specific billings**
```json
{
  "billingIds": ["billing-id-1", "billing-id-2"]
}
```

**Option 2: Send to specific classes**
```json
{
  "classIds": ["class-id-1", "class-id-2"],
  "status": "BILLED"
}
```

**Option 3: Send all unpaid**
```json
{
  "status": "OVERDUE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder sent to 25 student(s), 3 failed",
  "total": 28,
  "successful": 25,
  "failed": 3,
  "results": [
    {
      "billingId": "...",
      "studentName": "Ahmad Zaki",
      "sent": true,
      "messageId": "SM1234567890"
    },
    ...
  ]
}
```

---

### C. Preview Pending Reminders

**Endpoint:** `GET /api/whatsapp/send-reminder`

**Query Parameters:**
```
?classIds=class1,class2&status=OVERDUE
```

**Response:**
```json
{
  "success": true,
  "total": 45,
  "canSendTo": 43,
  "data": [
    {
      "billingId": "billing-123",
      "studentId": "student-456",
      "studentName": "Ahmad Zaki",
      "nisn": "12345",
      "hasPhoneNumber": true,
      "phoneNumber": "08123456789",
      "billingType": "SPP",
      "totalAmount": 500000,
      "paidAmount": 0,
      "remainingAmount": 500000,
      "status": "BILLED",
      "dueDate": "2024-11-30T00:00:00Z",
      "isOverdue": false
    },
    ...
  ]
}
```

---

### D. Scheduled Automated Reminders

**Endpoint:** `POST /api/whatsapp/scheduled-reminders`

**Authentication:** Header `x-cron-secret: YOUR_CRON_SECRET`

**Trigger Schedule:**
- 5 days before due date → send reminder
- 1 day before due date → send reminder  
- Daily for overdue → send reminder (max 1x per day per billing)

**Setup Cron Job:**

**Option 1: Using GitHub Actions**

Create `.github/workflows/whatsapp-reminders.yml`:

```yaml
name: WhatsApp Payment Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger WhatsApp Reminders
        run: |
          curl -X POST \
            https://your-domain.com/api/whatsapp/scheduled-reminders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

**Option 2: Using External Cron Service (e.g., cron-job.org)**

1. Buka [https://cron-job.org](https://cron-job.org)
2. Create new cronjob
3. Set URL: `https://your-domain.com/api/whatsapp/scheduled-reminders`
4. Add header: `x-cron-secret: YOUR_CRON_SECRET`
5. Set schedule: Daily at 9 AM

**Option 3: Using Node.js node-cron (Local Development)**

```bash
npm install node-cron
```

Create `src/jobs/whatsapp-reminders.ts`:

```typescript
import cron from 'node-cron';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running WhatsApp scheduled reminders...');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/scheduled-reminders`,
    {
      method: 'POST',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET || '',
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();
  console.log('Reminder job result:', result);
});
```

---

## 5. Automatic Payment Notification Flow

Ketika pembayaran diverifikasi (status → COMPLETED):

```
Bendahara verifies payment
    ↓
Payment status updated to COMPLETED
    ↓
Billing status updated (PAID or PARTIAL)
    ↓
WhatsApp notification triggered asynchronously
    ↓
Message sent to student's nomor WhatsApp
    ↓
Notification logged in NotificationLog
```

---

## 6. Message Templates

### Payment Success

```
Halo {nama_siswa},

Pembayaran Anda telah diterima dengan baik!

📋 Detail Pembayaran:
• Jenis Tagihan: SPP
• Jumlah: Rp 500.000
• Metode: TUNAI
• Nomor Transaksi: PAY202411001

Terima kasih telah melakukan pembayaran tepat waktu.

Hubungi sekolah jika ada pertanyaan.
```

### Payment Reminder (5 / 1 day before)

```
Halo {nama_siswa},

Pengingat: Anda memiliki tagihan yang belum dibayar

📋 Detail Tagihan:
• Jenis: SPP
• Jumlah: Rp 500.000
• Jatuh Tempo: 30 November 2024 (5 hari lagi)

Silakan segera lakukan pembayaran untuk menghindari denda keterlambatan.

Hubungi bendahara jika ada kesulitan.
```

### Overdue Reminder

```
Halo {nama_siswa},

⚠️ PEMBAYARAN TERLAMBAT

Pembayaran Anda telah 7 hari melewati tanggal jatuh tempo.

📋 Detail Tagihan:
• Jenis: SPP
• Jumlah: Rp 500.000
• Jatuh Tempo: 30 November 2024

Mohon segera lakukan pembayaran untuk menghindari konsekuensi lebih lanjut.

Hubungi bendahara sekarang.
```

---

## 7. Admin UI for Sending Reminders

Buat `/admin/whatsapp/send-reminder` page:

```typescript
'use client';

import { useState } from 'react';
import { fetchWithAuth } from '@/lib/api-client';
import { Card, Button, Select } from '@/components/ui';

export default function SendReminderPage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [status, setStatus] = useState('BILLED');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/whatsapp/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classIds: selectedClass ? [selectedClass] : [],
          status,
        }),
      });

      const data = await response.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Kirim Reminder Pembayaran</h1>

      <Card className="space-y-4">
        <Select
          label="Kelas (Optional)"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {/* Load classes */}
        </Select>

        <Select
          label="Status Tagihan"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="BILLED">Belum Dibayar (BILLED)</option>
          <option value="OVERDUE">Terlambat (OVERDUE)</option>
          <option value="PARTIAL">Dibayar Sebagian (PARTIAL)</option>
        </Select>

        <Button onClick={handleSend} isLoading={loading}>
          Kirim Reminder
        </Button>
      </Card>

      {result && (
        <Card className="bg-green-50">
          <p className="font-semibold text-green-900">{result.message}</p>
          <p className="text-sm text-green-700 mt-2">
            Berhasil: {result.successful} | Gagal: {result.failed}
          </p>
        </Card>
      )}
    </div>
  );
}
```

---

## 8. Troubleshooting

### Issue: "WhatsApp configuration not complete"

**Solusi:**
- Check `.env` file has all Twilio variables set
- Restart development server: `npm run dev`

### Issue: Message not sending

**Debug steps:**
1. Check:
   - Phone number format: must start with `+` (e.g., `+628123456789`)
   - Student has `noTelp` field filled in database
   - Twilio account has WhatsApp enabled
   - Twilio auth credentials are correct

2. Check logs:
   ```bash
   # See Twilio API responses
   tail -f logs/whatsapp.log
   ```

### Issue: Messages going to spam

**Solutions:**
- Use WhatsApp Business Account (not sandbox)
- Building trust with Twilio
- Ensure messages are relevant and not too frequent

---

## 9. Cost & Limits

### Twilio Pricing

- **Sandbox**: FREE (limited to 1 test number)
- **Production**: ~$0.0045 - $0.008 per message (varies by country)
- **Incoming**: $0.02 - $0.08 per message

### Rate Limits

- Max 80 messages per second per sender
- No bulk SMS limits

---

## 10. Data Privacy

✅ **Stored Data:**
- Phone numbers encrypted in transit
- Messages logged but not stored with full content (only summary)
- Compliant with GDPR/LCAP if configured

⚠ **Best Practices:**
- Get consent from students/parents before sending WhatsApp
- Include unsubscribe mechanism (optional)
- Don't store full message content longer than needed

---

## Next Steps

1. ✅ Create Twilio account & get credentials
2. ✅ Update `.env` with credentials
3. ✅ Run database migration
4. ✅ Test endpoints using Postman/curl
5. ✅ Create admin UI for sending reminders
6. ✅ Setup automated scheduled reminders (GitHub Actions or cron service)
7. ✅ Train bendahara team on using the feature
8. ✅ Monitor logs and adjust message frequency

---

**Need help?** Check Twilio docs: https://www.twilio.com/docs/whatsapp
