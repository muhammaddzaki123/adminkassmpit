# 📱 WhatsApp Web.js Integration Guide

Panduan lengkap untuk menggunakan **whatsapp-web.js** - solusi WhatsApp GRATIS tanpa Twilio!

---

## ✨ Keuntungan vs Twilio

| Fitur | whatsapp-web.js | Twilio |
|-------|-----------------|--------|
| **Biaya** | 🎉 GRATIS | $0.005-0.008/msg |
| **Setup** | Scan QR code | API key setup |
| **Phone Number** | Gunakan nomor pribadi | Perlu nomor bisnis |
| **Deployment** | VPS/Server lokal | Cloud/Serverless |
| **Reliability** | Community-supported | Enterprise SLA |
| **Learning Curve** | Sedang | Mudah |

---

## 🚀 Setup Steps

### Step 1: Ensure Node.js dan Chromium Installed

```bash
# Check Node version (need 14+)
node --version

# For Linux/Ubuntu, install dependencies for Puppeteer
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libfreetype6 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Check Console for QR Code

Ketika server berjalan, Anda akan melihat output seperti:

```
🚀 Initializing WhatsApp client on server startup...
✅ WhatsApp client initialization requested.
📱 Please scan the QR code that should appear in the console.

📱 SCAN QR CODE DI BAWAH DENGAN WHATSAPP:
█████████████████████████████████░░░░░░░░░░
████████████ ░░ █████████████████░░░░░░░░░
... [QR code displayed] ...
```

### Step 4: Scan QR Code dengan WhatsApp

1. **Buka WhatsApp di phone Anda**
2. **Tap Settings (⚙️)**
3. **Pilih "Linked Devices"**
4. **Tap "Link a Device"**
5. **Pindahkan phone ke monitor dan **SCAN QR CODE** yang ditampilkan**

### Step 5: Tunggu Koneksi Berhasil

Setelah scan berhasil, Anda akan melihat:

```
✅ WhatsApp Web client adalah ready!
✅ WhatsApp authenticated! Session saved.
```

**Selamat!** WhatsApp sekarang terhubung dan siap mengirim pesan.

---

## 🗂️ Folder Structure

```
.
├── .wwebjs_auth/           ← Session folder (auto-created)
│   └── Default/
│       ├── session.data
│       └── IndexedDB/
├── src/
│   ├── lib/
│   │   ├── whatsapp-client.ts    ← Core client
│   │   └── whatsapp.ts           ← Message templates
│   └── app/
│       └── api/
│           └── whatsapp/
│               ├── send/
│               ├── status/       ← NEW
│               ├── send-reminder/
│               └── scheduled-reminders/
└── instrumentation.ts     ← NEW: Auto-init on startup
```

---

## 📡 API Endpoints

### 1. Check Connection Status

```bash
curl http://localhost:3000/api/whatsapp/status
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "ready": true,
  "qrPending": false,
  "authenticatedAs": {
    "phone": "628123456789",
    "name": "Dzaki Muhammad"
  },
  "message": "Connected as Dzaki Muhammad"
}
```

### 2. Send Message

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "628123456789",
    "body": "Halo, ini test message!",
    "template": "payment_success"
  }'
```

### 3. Send Reminders (Manual)

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "status": "BILLED"
  }'
```

### 4. Scheduled Reminders (Cron)

```bash
curl -X POST http://localhost:3000/api/whatsapp/scheduled-reminders \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 🔐 Security Considerations

### Session Management

Session disimpan di `.wwebjs_auth/`:

```
.wwebjs_auth/
├── .gitignore    ← Add this!
├── Default/
│   ├── session.data
│   └── IndexedDB/
```

**PENTING:** Jangan push folder ini ke Git!

```bash
# Add to .gitignore
echo ".wwebjs_auth/" >> .gitignore
```

### Phone Number Privacy

- Phone numbers dikirim via WhatsApp encrypted channel
- Stored dalam database dengan enkripsi (jika configured)
- Messages tidak stored dalam full content (hanya summary)

---

## ⚠️ Limitations

### Tidak Boleh

❌ Spam oder mass-message tanpa limit
❌ Mengirim pesan komersial yang tidak diminta
❌ Menggunakan nomor bisnis untuk personal messages
❌ Mengubah pesan template terlalu sering

### Rate Limiting

- WhatsApp Web memiliki rate limit built-in
- Recommended: Max 10 messages per second
- Per 24 jam: Sebanding dengan active usage

### Session Expiry

- Session dapat expire jika:
  - Phone logged out from WhatsApp
  - Session file corrupted
  - Browser instance closed unexpectedly

**Solusi:** Restart server atau scan QR code ulang

---

## 🔧 Troubleshooting

### ❌ "WhatsApp client could not be initialized"

**Penyebab:** Session belum di-authenticate

**Solusi:**
1. Buka console server Anda
2. Cari QR code
3. Scan dengan WhatsApp
4. Tunggu hingga "ready"

---

### ❌ "Failed to send message: Target user must be a contact..."

**Penyebab:** Nomor tujuan belum ada di phone Anda

**Solusi:** Tambahkan nomor tersebut ke Kontak WhatsApp Anda terlebih dahulu

---

### ❌ "Session is already attached"

**Penyebab:** Lebih dari 1 instance sedang berjalan

**Solusi:**
```bash
# Kill all Node processes
killall node

# Or specific process
npm run stop

# Then restart
npm run dev
```

---

### ❌ "Puppeteer error: Failed to launch browser"

**Penyebab:** Chromium dependencies tidak installed

**Solusi (Linux):**
```bash
sudo apt-get install -y \
  libxss1 libappindicator1 libindicator7
```

**Solusi (macOS):**
```bash
# Brew should handle this
brew install chromium
```

**Solusi (Windows):**
- Usually works out of the box
- If not, download Chromium manually from puppeteer

---

## 📊 Performance Tips

### 1. Use Message Queue untuk Bulk Sends

```typescript
// Kirim dengan delay to avoid rate limiting
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

for (const message of messages) {
  await sendWhatsAppMessage(message);
  await delay(1000); // 1 second per message
}
```

### 2. Monitor Connection Status

```bash
# Check status di monitoring dashboard
curl http://your-domain.com/api/whatsapp/status
```

### 3. Automatic Reconnection

whatsapp-web.js handles reconnection automatically, but you dapat monitor:

```typescript
client.on('disconnected', (reason) => {
  console.warn('Disconnected:', reason);
  // Notify admin
});
```

---

## 🚀 Deployment Guide

### Option 1: VPS (Recommended)

**Providers:** DigitalOcean, Linode, AWS EC2

**Setup:**
```bash
# SSH into VPS
ssh user@your-vps.com

# Clone repo
git clone https://github.com/yourusername/adminkassmpit.git
cd adminkassmpit

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with database credentials

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: "adminkassmpit",
    script: "npm",
    args: "run start",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
```

### Option 2: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Chromium dependencies
RUN apk add --no-cache \
  ca-certificates \
  fonts-noto \
  libx11 \
  libxcomposite \
  libxfixes \
  libxrandr \
  libxrender \
  noto-fonts \
  xkeyboard-config

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create volume for session persistence
VOLUME ["./.wwebjs_auth"]

CMD ["npm", "run", "start"]
```

```bash
# Build
docker build -t adminkassmpit .

# Run with volume for session persistence
docker run -d \
  -p 3000:3000 \
  -v whatsapp_session:/.wwebjs_auth \
  --name adminkassmpit \
  adminkassmpit
```

### Option 3: Docker Compose

```yaml
version: '3.8'

services:
  app:
    image: adminkassmpit
    ports:
      - "3000:3000"
    volumes:
      - whatsapp_session:/.wwebjs_auth
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@postgres:5432/adminkassmpit
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: adminkassmpit

volumes:
  whatsapp_session:
  postgres_data:
```

---

## 📋 Cron Job Setup

### GitHub Actions

```yaml
name: WhatsApp Reminders

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily

jobs:
  reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send scheduled reminders
        run: |
          curl -X POST https://your-domain.com/api/whatsapp/scheduled-reminders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

### cron-job.org

1. Buka https://cron-job.org
2. Create New Cronjob
3. URL: `https://your-domain.com/api/whatsapp/scheduled-reminders`
4. Schedule: Daily 9 AM
5. Header: `x-cron-secret: YOUR_SECRET`
6. Save

---

## ✅ Checklist Before Going Live

- [ ] Session fully authenticated (scan QR code)
- [ ]`.wwebjs_auth` in `.gitignore`
- [ ] Database migration applied (`npx prisma db push`)
- [ ] Test sending message manually
- [ ] Test reminder endpoints
- [ ] Cron job configured
- [ ] PM2/Docker setup for auto-restart
- [ ] Monitoring alerts configured
- [ ] Backup strategy for `.wwebjs_auth`

---

## 📞 Support

- **whatsapp-web.js Docs**: https://docs.wwebjs.dev
- **GitHub Issues**: https://github.com/pedrosans/WhatsApp-Web.js/issues
- **Community**: https://discord.gg/99...

---

**Status:** ✅ Ready to use!  
**Last Updated:** December 20, 2024  
**Migration from:** Twilio (Paid) → whatsapp-web.js (FREE)
