# 🧪 WhatsApp Endpoints Testing Guide

Quick reference untuk testing semua WhatsApp endpoints menggunakan curl atau Postman.

---

## 1️⃣ Test Twilio Configuration

### Verify Twilio Credentials

```bash
# Test Twilio auth works
curl -u "TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN" \
  "https://api.twilio.com/2010-04-01/Accounts/TWILIO_ACCOUNT_SID"

# Should return 200 with account details
```

---

## 2️⃣ Test WhatsApp Send Endpoint

### Endpoint: `POST /api/whatsapp/send`

**Purpose**: Send manual WhatsApp message (for testing & special cases)

### cURL Test

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+628123456789",
    "body": "Halo, ini pesan test dari KASSMPIT",
    "template": "payment_success"
  }'
```

### Expected Response (Success)

```json
{
  "success": true,
  "messageId": "SM1234567890abcdef",
  "phoneNumber": "+628123456789",
  "message": "Halo, ini pesan test dari KASSMPIT",
  "status": "queued"
}
```

### Expected Response (Error - No Credentials)

```json
{
  "success": false,
  "error": "Twilio configuration not complete"
}
```

### Postman Setup

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/whatsapp/send`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "to": "+628123456789",
     "body": "Pesan test",
     "template": "payment_success"
   }
   ```

---

## 3️⃣ Test Reminder Preview (GET)

### Endpoint: `GET /api/whatsapp/send-reminder`

**Purpose**: Preview pending reminders (no sending, just listing)

### cURL Test - All Unpaid

```bash
curl -X GET "http://localhost:3000/api/whatsapp/send-reminder" \
  -H "Content-Type: application/json"
```

### cURL Test - By Class

```bash
curl -X GET "http://localhost:3000/api/whatsapp/send-reminder?classIds=class-uuid-1,class-uuid-2&status=BILLED" \
  -H "Content-Type: application/json"
```

### cURL Test - Overdue Only

```bash
curl -X GET "http://localhost:3000/api/whatsapp/send-reminder?status=OVERDUE" \
  -H "Content-Type: application/json"
```

### Expected Response (Success)

```json
{
  "success": true,
  "total": 45,
  "canSendTo": 43,
  "message": "Found 43 students with valid phone numbers",
  "data": [
    {
      "billingId": "billing-123-uuid",
      "studentId": "student-456-uuid",
      "studentName": "Ahmad Zaki",
      "nisn": "12345678901",
      "hasPhoneNumber": true,
      "phoneNumber": "08123456789",
      "billingType": "SPP Bulan 1",
      "totalAmount": 500000,
      "paidAmount": 0,
      "remainingAmount": 500000,
      "status": "BILLED",
      "dueDate": "2024-11-30T00:00:00Z",
      "isOverdue": false
    },
    {
      "billingId": "billing-124-uuid",
      "studentId": "student-457-uuid",
      "studentName": "Siti Nur Aini",
      "nisn": "12345678902",
      "hasPhoneNumber": true,
      "phoneNumber": "08234567890",
      "billingType": "SPP Bulan 1",
      "totalAmount": 500000,
      "paidAmount": 250000,
      "remainingAmount": 250000,
      "status": "PARTIAL",
      "dueDate": "2024-11-30T00:00:00Z",
      "isOverdue": false
    }
  ]
}
```

### Query Parameters

| Param | Type | Example | Optional |
|-------|------|---------|----------|
| `classIds` | string (comma-separated) | `class-1,class-2` | Yes |
| `status` | string | `BILLED`, `OVERDUE`, `PARTIAL` | Yes |

---

## 4️⃣ Test Send Reminders (POST)

### Endpoint: `POST /api/whatsapp/send-reminder`

**Purpose**: Send reminders to batch of students (actual sending)

### cURL Test - Send to Specific Class + Status

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "classIds": ["class-id-1", "class-id-2"],
    "status": "BILLED"
  }'
```

### cURL Test - Send to Specific Billings

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "billingIds": ["billing-id-1", "billing-id-2", "billing-id-3"]
  }'
```

### cURL Test - Send All Overdue

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "status": "OVERDUE"
  }'
```

### Expected Response (Success)

```json
{
  "success": true,
  "message": "Reminder sent to 25 student(s), 1 failed",
  "total": 26,
  "successful": 25,
  "failedCount": 1,
  "results": [
    {
      "billingId": "billing-123",
      "studentId": "student-1",
      "studentName": "Ahmad Zaki",
      "phoneNumber": "+628123456789",
      "sent": true,
      "messageId": "SM1234567890abcdef",
      "message": "Halo Ahmad Zaki, Anda memiliki..."
    },
    {
      "billingId": "billing-124",
      "studentId": "student-2",
      "studentName": "Siti Nur",
      "phoneNumber": null,
      "sent": false,
      "error": "No phone number available",
      "messageId": null
    }
  ]
}
```

### Expected Response (Error - Unauthorized)

```json
{
  "success": false,
  "error": "Unauthorized - requires TREASURER or ADMIN role"
}
```

---

## 5️⃣ Test Scheduled Reminders (POST)

### Endpoint: `POST /api/whatsapp/scheduled-reminders`

**Purpose**: Run scheduled reminders (normally called by cron)

### cURL Test - With Secret Header

```bash
curl -X POST http://localhost:3000/api/whatsapp/scheduled-reminders \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-cron-secret" \
  -d '{}'
```

### Expected Response (Success)

```json
{
  "success": true,
  "message": "Scheduled reminders processed",
  "results": {
    "fiveDayWarnings": {
      "sent": 12,
      "failed": 0,
      "details": [
        {
          "billingId": "billing-200",
          "studentName": "Ahmad Zaki",
          "daysUntilDue": 5,
          "sent": true,
          "messageId": "SM2000"
        }
      ]
    },
    "oneDayWarnings": {
      "sent": 8,
      "failed": 0,
      "details": [
        {
          "billingId": "billing-300",
          "studentName": "Budi Raharjo",
          "daysUntilDue": 1,
          "sent": true,
          "messageId": "SM3000"
        }
      ]
    },
    "overdueReminders": {
      "sent": 24,
      "failed": 2,
      "skipped": 5,
      "details": [
        {
          "billingId": "billing-400",
          "studentName": "Citra Dewi",
          "daysOverdue": 7,
          "sent": true,
          "messageId": "SM4000"
        },
        {
          "billingId": "billing-401",
          "studentName": "Dedy Prasetyo",
          "daysOverdue": 3,
          "sent": false,
          "skipped": true,
          "reason": "Already reminded today (lastReminderSentAt)"
        }
      ]
    }
  },
  "totalSent": 44,
  "totalFailed": 2,
  "totalSkipped": 5,
  "timestamp": "2024-11-20T09:00:00Z"
}
```

### Expected Response (Error - Invalid Secret)

```json
{
  "success": false,
  "error": "Invalid cron secret"
}
```

### Expected Response (Error - Missing Header)

```json
{
  "success": false,
  "error": "Missing x-cron-secret header"
}
```

---

## 🧪 Full Integration Test Scenario

### Scenario: Payment → Notification Flow

**Step 1: Verify Payment Endpoint**

```bash
# Make payment
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-uuid",
    "status": "COMPLETED"
  }'
```

**Expected**: Response should include `"whatsappSent": true`

```json
{
  "success": true,
  "data": {
    "payment": { ... },
    "billing": { ... },
    "whatsappSent": true,
    "notificationStatus": "queued"
  }
}
```

**Step 2: Check NotificationLog**

```bash
# Query the database or use admin panel to see:
# - Timestamp of message
# - Recipient phone number
# - Message type: "payment_success"
# - Send status: "queued", "delivered", or "failed"
```

**Step 3: Verify Student Received WhatsApp**

- Open WhatsApp on test phone number
- Should see message: "Halo [NamaStudis], Pembayaran Anda telah diterima..."
- Check status: ✔ (sent) or ✔✔ (delivered)

---

## 🔍 Debugging Tips

### Check Environment Variables

```bash
# Verify .env is loaded correctly
# In your Next.js app:
console.log(process.env.TWILIO_ACCOUNT_SID) // should not be undefined
```

### Try Twilio Sandbox

Before using production, test with Twilio WhatsApp Sandbox:

1. Open Twilio Console → Messaging → WhatsApp
2. Follow sandbox setup instructions
3. Send test message to sandbox WhatsApp number

### Check NotificationLog

```
SELECT * FROM "NotificationLog" 
WHERE "type" = 'payment_success' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Monitor Logs

```bash
# Development
npm run dev
# Look for: "WhatsApp message queued", "Reminder sent", errors

# Production (check hosting logs)
# Vercel: https://vercel.com/dashboard
# Heroku: heroku logs --tail
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Twilio configuration not complete" | Missing env vars | Check `.env` has all Twilio vars |
| "Invalid phone number" | Phone not formatted correctly | Phone must match regex `^(\+)?[0-9]{10,}$` |
| "No phone number available" | Student record has no `noTelp` | Add phone to Student record in database |
| "Invalid cron secret" | Secret doesn't match | Check CRON_SECRET in .env |
| "Request timeout" | Twilio API slow | Adjust timeout in sendWhatsAppMessage |

---

## 📧 Test Endpoints by Email

For easily sharing test process:

```
Testing WhatsApp Integration:

1. GET http://localhost:3000/api/whatsapp/send-reminder
   - Lists pending reminders

2. POST http://localhost:3000/api/whatsapp/send-reminder
   - Sends reminders to filtered students

3. POST http://localhost:3000/api/whatsapp/send
   - Manual send (with all params)

4. POST http://localhost:3000/api/whatsapp/scheduled-reminders
   - Runs automated 5-day, 1-day, overdue reminders
   - Requires x-cron-secret header
```

---

## 🚀 Performance Testing

### Load Test: Send 1000 Reminders

```bash
# Using Apache Bench
ab -n 1 -c 1 -p payload.json \
  http://localhost:3000/api/whatsapp/send-reminder

# Using wrk (better for concurrent)
wrk -t4 -c10 -d30s http://localhost:3000/api/whatsapp/scheduled-reminders \
  -H "x-cron-secret: YOUR_SECRET"
```

### Expected Performance

- Single message send: ~500ms - 1.5s (Twilio API latency)
- Batch 25 reminders: ~12-37 seconds (depends on concurrency)
- Batch 100 reminders: ~50-120 seconds

---

**Last Updated**: Session completion  
**Use Case**: Testing WhatsApp features during development & deployment
