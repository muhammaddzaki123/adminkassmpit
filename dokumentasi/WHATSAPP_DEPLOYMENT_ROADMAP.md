# 🚀 WhatsApp Bot Deployment Roadmap

Panduan lengkap untuk mengaktifkan WhatsApp Bot dari sekarang hingga production-ready.

---

## 📋 Overview

**Total Time Estimate**: 2-3 jam untuk complete setup  
**Difficulty**: Medium (mostly configuration)  
**Blockers**: Memerlukan Twilio account

---

## ✅ Phase 1: Immediate Actions (Next 30 minutes)

### Action 1️⃣: Build Validation

```bash
# Jalankan build untuk validate semua WhatsApp code
npm run build

# Expected output:
# ✓ No TypeScript errors
# ✓ All imports resolved
# ✓ Schema types checked
```

**What it does:**
- Validates WhatsApp library imports
- Checks API route syntax
- Verifies Prisma schema updates

**If errors occur:**
- Most likely: Missing type definitions
- Solution: Check imports in endpoint files
- Docs: See troubleshooting section below

---

### Action 2️⃣: Database Migration

```bash
# Sync lastReminderSentAt field ke database
npx prisma db push

# Expected output:
# ✓ Migration successful
# ✓ Billing table updated with lastReminderSentAt column
```

**What it does:**
- Menambah kolom `lastReminderSentAt` ke tabel `billing`
- Digunakan untuk throttle daily overdue reminders

**Verify:**
```bash
# Connect to PostgreSQL dan check
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='Billing' AND COLUMN_NAME='lastReminderSentAt';
```

---

### Action 3️⃣: Twilio Account Setup (45 min)

**Step A: Create Account**

1. Buka [https://www.twilio.com/console](https://www.twilio.com/console)
2. Sign up atau login
3. Verify email dan nomor telepon

**Step B: Get WhatsApp Sandbox**

1. Di Twilio Console: **Messaging** → **Send an SMS** (or direct to WhatsApp)
2. Pilih **WhatsApp** (jika ada)
3. Klik **Get Started with WhatsApp Sandbox**
4. Follow instructions untuk verify account

**Step C: Collect Credentials**

Di Twilio Console, kumpulkan:

```
📌 TWILIO_ACCOUNT_SID = "AC" + 32 karakter (contoh: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
📌 TWILIO_AUTH_TOKEN = 32 karakter panjang
📌 TWILIO_WHATSAPP_FROM = "whatsapp:+62812345678"
```

**Where to find:**
- Account SID: Home page (always shown)
- Auth Token: Settings → Account → Auth Token (click Show)
- WhatsApp From: Messaging → WhatsApp → Sender Phone Number

**Screenshot Path:**
```
Console Home
  ├─ Your Account SID [here]
  ├─ Settings (top right)
  │   └─ Account → Auth Token
  └─ Messaging
      └─ Services → WhatsApp → Phone Numbers
```

---

### Action 4️⃣: Update .env File

```bash
# Di root project, edit .env (atau buat jika belum ada)
# Ini adalah file LOCAL - jangan push ke git!

# Paste dari Twilio credentials:
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="auth_token_dari_twilio"
TWILIO_WHATSAPP_FROM="whatsapp:+62812345678"

# Generate CRON_SECRET (random string):
# macOS/Linux:
openssl rand -hex 32
# Copy output ke:
CRON_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# JWT configuration (existing):
NEXTAUTH_JWT_SECRET="existing_secret"
NEXTAUTH_SECRET="existing_secret"
```

**Verify:**
```bash
# Restart dev server
npm run dev

# Di console, tidak boleh ada error tentang WhatsApp
# Test: 
# curl http://localhost:3000/api/whatsapp/send \
#   -H "Content-Type: application/json" \
#   -d '{"to": "+62812345678", "body": "test"}'
```

---

## ⏳ Phase 2: Testing & Validation (45 min)

### Action 5️⃣: Test Twilio Connection

```bash
# Test endpoint send
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+628123456789",
    "body": "Test message dari KASSMPIT",
    "template": "payment_success"
  }'

# Expected response:
{
  "success": true,
  "messageId": "SMxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

**If error:**
- "Twilio configuration not complete" → Check .env vars
- "Invalid phone number" → Phone harus format +62...
- "Request timeout" → Twilio might be slow, retry

---

### Action 6️⃣: Test Reminder Preview

```bash
# Lihat pending reminders (jangan send dulu)
curl -X GET "http://localhost:3000/api/whatsapp/send-reminder?status=BILLED" \
  -H "Content-Type: application/json"

# Expected: List of students dengan unpaid billings
# Check: hasPhoneNumber field = true/false
```

---

### Action 7️⃣: Test Reminder Send

```bash
# Send reminder ke 1 class
curl -X POST http://localhost:3000/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_AUTH_COOKIE" \
  -d '{
    "classIds": ["kelas-10-a-uuid"],
    "status": "BILLED"
  }'

# Expected: {successful: N, failed: M}
```

**Note:** Ini require authentication - gunakan Postman atau browser dev tools untuk get cookies.

---

### Action 8️⃣: Verify Notification Logging

```bash
# Connect ke database dan check NotificationLog
SELECT * FROM "NotificationLog" 
WHERE "type" = 'payment_success' 
ORDER BY "createdAt" DESC 
LIMIT 10;

# Should show entries dari test sends
```

---

## 🔧 Phase 3: Production Setup (45 min)

### Action 9️⃣: Configure Cron Job

**Option 1: GitHub Actions (Recommended for most)**

Di `.github/workflows/whatsapp-reminders.yml`:

```yaml
name: WhatsApp Payment Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Setiap hari jam 9 AM UTC

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger WhatsApp Reminders
        run: |
          curl -X POST \
            ${{ secrets.NEXT_PUBLIC_APP_URL }}/api/whatsapp/scheduled-reminders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

**Setup steps:**
1. Di GitHub repo: **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `CRON_SECRET` = value dari .env
3. Add secret: `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
4. Commit file ke `.github/workflows/`

**Option 2: cron-job.org (No code needed)**

1. Buka [https://cron-job.org](https://cron-job.org)
2. Sign up
3. Create new cronjob:
   - URL: `https://yourdomain.com/api/whatsapp/scheduled-reminders`
   - Schedule: Daily at 9 AM
   - Add header: `x-cron-secret: YOUR_CRON_SECRET`
4. Save & Enable

**Option 3: Vercel Crons (If using Vercel)**

Di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/whatsapp/scheduled-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

### Action 🔟: Update Production Environment

**If using Vercel:**

```bash
# Set secrets di Vercel dashboard
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN  
vercel env add TWILIO_WHATSAPP_FROM
vercel env add CRON_SECRET
```

**If using other hosting (Railway, Render, etc):**

- Go to app settings
- Add environment variables:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_WHATSAPP_FROM
  - CRON_SECRET
- Redeploy app

---

### Action 1️⃣1️⃣: Go Live with Twilio Business Account

**When ready for real users (not sandbox):**

1. Apply untuk WhatsApp Business Account di Twilio
   - Expected approval: 1-3 hari
   - Memerlukan: Business info, phone number, use case

2. Once approved:
   - Get business phone number
   - Update `TWILIO_WHATSAPP_FROM` dengan nomor real
   - Deploy ke production
   - Double-check: All.env vars correct

3. Test lagi dengan production credentials

---

## 🧪 Phase 4: Monitoring & Optimization (Ongoing)

### Action 1️⃣2️⃣: Setup Monitoring

**Monitor these:**

1. **WhatsApp Send Success Rate**
   ```sql
   SELECT 
     DATE(created_at),
     COUNT(*) total,
     COUNT(CASE WHEN status='delivered' THEN 1 END) delivered,
     COUNT(CASE WHEN status='failed' THEN 1 END) failed
   FROM notification_log
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

2. **Failed Reminders Alert**
   ```sql
   SELECT * FROM notification_log 
   WHERE status='failed' 
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

3. **Scheduled Job Execution**
   - Check GitHub Actions logs weekly
   - Verify: Job runs at 9 AM UTC
   - Check: No errors in output

---

### Action 1️⃣3️⃣: Optimize Message Frequency

Based on usage patterns, tune:

- **5-day reminder**: Send to all BILLED
- **1-day reminder**: Send to all BILLED + PARTIAL
- **Overdue reminder**: Send to OVERDUE (throttled 1× daily)

**Adjust if needed:** Edit `src/app/api/whatsapp/scheduled-reminders/route.ts`

---

### Action 1️⃣4️⃣: User Training

Train bendahara (treasurer) team:

1. **How to send manual reminders:**
   - Go to `/admin/whatsapp/send-reminder` (optional UI)
   - Select class & status
   - Click "Kirim Reminder"
   - Wait for confirmation

2. **Monitor results:**
   - Check NotificationLog in database
   - See success/failed counts
   - Investigate failures

3. **When to send:**
   - 1 week before due date (manual)
   - Day before due date (manual)
   - Day after due date if still unpaid (manual)
   - Automatic alerts: handled by cron job

---

## 📊 Implementation Timeline

```
Day 1 (Today):
  ✓ Build validation (5 min)
  ✓ Database migration (5 min)
  ✓ Twilio setup (30 min)
  ✓ Update .env (5 min)
  ✓ Test endpoints (15 min)

Day 2:
  ✓ Cron job setup (15 min)
  ✓ Production deployment (15 min)
  ✓ Testing with production (30 min)

Week 1:
  ✓ Team training (30 min)
  ✓ Go live for real users
  ✓ Monitor first week

Week 2+:
  ✓ Optimize based on metrics
  ✓ Resolve any issues
  ✓ Scale if needed
```

---

## 🆘 Troubleshooting

### Build fails with "Cannot find module"

```bash
# Solution:
npm install
npm run build
```

### Database migration fails

```bash
# Check Prisma setup:
npx prisma db push --force-reset

# Or if data matters, create new migration:
npx prisma migrate dev --name add_whatsapp_fields
```

### WhatsApp messages not sending

**Checklist:**
- [ ] .env has TWILIO_ACCOUNT_SID
- [ ] .env has TWILIO_AUTH_TOKEN
- [ ] .env has TWILIO_WHATSAPP_FROM
- [ ] Phone number format: +62... (not 08...)
- [ ] Twilio account verified
- [ ] WhatsApp Sandbox enabled (for dev)

### Cron job not triggering

**GitHub Actions:**
- Check: Actions tab → see if job listed
- Check: Runs section → see logs
- Verify: Time zone is UTC

**cron-job.org:**
- Check: Dashboard → see last run time
- Verify: URL is reachable (no 404)
- Check: CRON_SECRET header is set

### Twilio Sandbox Limitations

Sandbox mode:
- Can only send to 1 verified number
- Messages take longer
- Limited throughput

Solution: Apply untuk Business Account untuk production

---

## ✨ Post-Launch Optimization

Once live:

1. **Tune reminder timing**
   - Does 5 days before feel too early?
   - Should we add 3-day reminder?

2. **Personalize messages**
   - Add school name/logo context
   - Maybe include QR code untuk payment link?

3. **Add interactive features**
   - WhatsApp button untuk "Bayar Sekarang"
   - Reply parsing untuk payment status queries

4. **Expand notifications**
   - New student enrollment confirmation
   - Grade reports
   - Attendance alerts
   - Scholarship notifications

---

## 📞 Support Checklist

- [ ] Twilio docs bookmarked: https://www.twilio.com/docs/whatsapp
- [ ] Your Twilio account URL saved
- [ ] CRON_SECRET stored securely (not in code)
- [ ] Prod env vars backed up
- [ ] Monitoring queries saved
- [ ] Team contact list for issues

---

## ✅ Final Verification Checklist

Before declaring "DONE":

- [ ] Build passes without errors
- [ ] Database migration applied
- [ ] Twilio credentials working
- [ ] Manual test message sent successfully
- [ ] Reminder preview shows students
- [ ] Reminder send works (desktop/admin)
- [ ] NotificationLog has entries
- [ ] Cron job configured
- [ ] Production env vars set
- [ ] First test payment → notification works
- [ ] Team trained
- [ ] Monitoring set up

---

**READY TO START?** Begin with Phase 1, Action 1 (Build Validation)

**Questions?** Check [WHATSAPP_BOT_SETUP.md](WHATSAPP_BOT_SETUP.md) or [WHATSAPP_TESTING_GUIDE.md](WHATSAPP_TESTING_GUIDE.md)
