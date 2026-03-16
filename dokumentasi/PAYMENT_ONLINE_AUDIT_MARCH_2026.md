# Audit Mendalam Endpoint Pembayaran Online (VA/Webhook)

Tanggal audit: 2026-03-17

## Ringkasan Hasil

Status: LULUS DENGAN PERBAIKAN

Perbaikan yang diterapkan:
1. Aktivasi endpoint webhook online baru: `POST /api/payment/webhook`
2. Penyambungan alur `create payment -> externalId -> webhook callback -> update billing`
3. Pengayaan data payment online pada endpoint create:
   - `externalId`
   - `vaNumber` (khusus VA)
   - `expiredAt`
   - `deeplink` (khusus EWALLET)
4. Implementasi idempotensi webhook untuk callback berulang.
5. Dukungan verifikasi secret webhook via header `x-webhook-secret` (jika env `PAYMENT_WEBHOOK_SECRET` diisi).

## Endpoint yang Diaudit

1. `POST /api/payment/create`
2. `POST /api/payment/webhook`
3. `GET /api/payment/list`
4. `POST /api/payment/verify` (alur manual bendahara)

## Skenario Uji Transaksi Nyata (Staging)

Catatan:
- Ganti `<BASE_URL>` sesuai staging.
- Gunakan token user siswa untuk create payment online.
- Gunakan secret webhook sesuai environment staging.

### 1) Create pembayaran VA (siswa)

```bash
curl -X POST "<BASE_URL>/api/payment/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_SISWA>" \
  -d '{
    "billingId": "<BILLING_ID>",
    "amount": 250000,
    "method": "VIRTUAL_ACCOUNT",
    "notes": "Uji VA staging"
  }'
```

Ekspektasi:
- HTTP 200
- `data.payment.status = PENDING`
- `data.payment.externalId` terisi
- `data.payment.vaNumber` terisi
- `data.paymentInstructions` terisi

### 2) Callback webhook sukses (simulasi provider)

```bash
curl -X POST "<BASE_URL>/api/payment/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>" \
  -d '{
    "externalId": "<EXTERNAL_ID_DARI_STEP_1>",
    "status": "SUCCESS",
    "paidAt": "2026-03-17T10:15:00.000Z",
    "message": "Settlement success from provider"
  }'
```

Ekspektasi:
- HTTP 200
- `status payment -> COMPLETED`
- `billing.paidAmount` bertambah sesuai amount
- `billing.status` berubah jadi `PARTIAL` atau `PAID`

### 3) Callback webhook duplikat (idempotent)

Ulangi request pada step 2 dengan payload yang sama.

Ekspektasi:
- HTTP 200
- response `idempotent: true` (atau state tidak berubah)
- tidak ada penambahan `billing.paidAmount` kedua kali

### 4) Verifikasi di daftar pembayaran

```bash
curl "<BASE_URL>/api/payment/list?search=<PAYMENT_NUMBER>" \
  -H "Authorization: Bearer <TOKEN_BENDAHARA_ATAU_ADMIN>"
```

Ekspektasi:
- payment muncul dengan status `COMPLETED`
- relasi billing & siswa tampil

### 5) Skenario gagal

Webhook status gagal:

```bash
curl -X POST "<BASE_URL>/api/payment/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>" \
  -d '{
    "externalId": "<EXTERNAL_ID_DARI_STEP_1>",
    "status": "FAILED",
    "message": "Payment failed"
  }'
```

Ekspektasi:
- payment status jadi `FAILED`
- billing tidak bertambah

## Titik Risiko yang Perlu Monitoring

1. Integrasi provider payment masih mode generik/simulasi (belum SDK provider spesifik).
2. Endpoint lama `route_deprecated.ts` dan `route.ts.bak` masih ada untuk referensi historis.
3. Untuk produksi wajib mengisi env `PAYMENT_WEBHOOK_SECRET`.

## Kesimpulan

Alur pembayaran online sekarang sudah tersambung end-to-end pada model Billing/Payment:
- create payment online
- callback webhook
- update status payment
- update saldo tagihan siswa
- aman terhadap callback ganda (idempotent)
