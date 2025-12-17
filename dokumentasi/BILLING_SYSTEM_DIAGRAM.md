# 📊 DIAGRAM ARSITEKTUR SISTEM KEUANGAN PROFESIONAL

## 1. RELASI DATABASE (ERD Simplified)

```
┌─────────────────┐
│  AcademicYear   │
│  - year         │◄──────────┐
│  - startDate    │            │
│  - endDate      │            │
│  - isActive     │            │
└─────────────────┘            │
         ▲                     │
         │                     │
         │                     │
┌────────┴─────────┐           │
│  StudentClass    │           │
│  - enrollmentDate│           │
│  - isActive      │           │
└──────────────────┘           │
    ▲          ▲               │
    │          │               │
    │          │               │
┌───┴────┐  ┌─┴─────────┐     │
│ Student│  │   Class   │     │
│        │  │  - grade  │     │
│ - nisn │  │  - sppAmt │     │
└────┬───┘  └───────────┘     │
     │                        │
     │                        │
     ▼                        │
┌─────────────────┐           │
│    Billing      │───────────┘
│  - billNumber   │
│  - type         │ (SPP, UANG_GEDUNG, dll)
│  - month/year   │
│  - totalAmount  │
│  - paidAmount   │
│  - status       │ (UNBILLED, BILLED, PARTIAL, PAID, OVERDUE)
│  - dueDate      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    Payment      │
│  - paymentNum   │
│  - amount       │ (bisa cicilan!)
│  - method       │
│  - status       │
│  - paidAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ PaymentDetail   │
│  - description  │
│  - amount       │
└─────────────────┘
```

---

## 2. WORKFLOW PEMBAYARAN

```
┌──────────────────────────────────────────────────────────────┐
│                    WORKFLOW PROFESIONAL                       │
└──────────────────────────────────────────────────────────────┘

1️⃣ SETUP AWAL (Sekali di awal tahun ajaran)
   ┌──────────────┐
   │ Admin Setup  │
   └──────┬───────┘
          │
          ├─► Buat AcademicYear "2024/2025" (isActive = true)
          ├─► Buat Class (7A, 7B, 8A, 8B, 9A, 9B)
          ├─► Set sppAmount per Class (7: 150k, 8: 175k, 9: 200k)
          └─► Assign Student → StudentClass


2️⃣ GENERATE TAGIHAN (Setiap bulan/awal tahun)
   ┌──────────────────┐
   │ System/Admin     │
   └────────┬─────────┘
            │
            ▼
   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃  BUAT BILLING (Invoice)   ┃
   ┃  - Generate untuk semua   ┃
   ┃    siswa aktif            ┃
   ┃  - Type: SPP              ┃
   ┃  - Month: 11, Year: 2024  ┃
   ┃  - Status: BILLED         ┃
   ┃  - DueDate: 10 Nov 2024   ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛


3️⃣ SISWA BAYAR
   ┌──────────────┐
   │ Siswa Login  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────┐
   │ Lihat Tagihan (Billing) │
   │ Status: BILLED/OVERDUE  │
   └──────────┬──────────────┘
              │
              ▼
   ┌─────────────────────────┐
   │ Pilih Metode Pembayaran │
   │ - VA, Transfer, E-Wallet│
   └──────────┬──────────────┘
              │
              ▼
   ┏━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃  CREATE PAYMENT        ┃
   ┃  - billingId: xxx      ┃
   ┃  - amount: 150.000     ┃
   ┃  - status: PENDING     ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━┛


4️⃣ WEBHOOK PAYMENT GATEWAY
   ┌──────────────────┐
   │ Payment Gateway  │
   │ (Xendit/Midtrans)│
   └────────┬─────────┘
            │
            ▼ Callback
   ┏━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃  UPDATE PAYMENT        ┃
   ┃  - status: COMPLETED   ┃
   ┃  - paidAt: now()       ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━┛
            │
            ▼
   ┏━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃  UPDATE BILLING        ┃
   ┃  - paidAmount += 150k  ┃
   ┃                        ┃
   ┃  IF paidAmount == tot: ┃
   ┃    status = PAID ✅    ┃
   ┃  ELSE:                 ┃
   ┃    status = PARTIAL ⚠️ ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━┛


5️⃣ AUTO UPDATE STATUS (Cron Job Harian)
   ┌──────────────┐
   │ Cron Daily   │
   └──────┬───────┘
          │
          ▼
   ┏━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃  CHECK BILLING         ┃
   ┃                        ┃
   ┃  WHERE:                ┃
   ┃    dueDate < NOW()     ┃
   ┃    status != PAID      ┃
   ┃                        ┃
   ┃  UPDATE:               ┃
   ┃    status = OVERDUE ❌ ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━┛
          │
          ▼
   ┌─────────────────────┐
   │ Send WA Reminder    │
   │ "SPP belum dibayar" │
   └─────────────────────┘
```

---

## 3. CONTOH DATA FLOW

### Scenario: Dzaki Bayar SPP November 2024 (Cicilan 2x)

```
📅 1 November 2024 - GENERATE TAGIHAN
┌─────────────────────────────────────────┐
│ BILLING                                 │
├─────────────────────────────────────────┤
│ billNumber:   "INV/2024/11/001"         │
│ studentId:    "dzaki-uuid"              │
│ academicYearId: "2024-2025-uuid"        │
│ type:         SPP                       │
│ month:        11                        │
│ year:         2024                      │
│ totalAmount:  150,000                   │
│ paidAmount:   0                         │
│ status:       BILLED                    │
│ dueDate:      2024-11-10                │
└─────────────────────────────────────────┘


📅 5 November 2024 - BAYAR CICILAN 1
┌─────────────────────────────────────────┐
│ PAYMENT #1                              │
├─────────────────────────────────────────┤
│ paymentNumber: "PAY/2024/11/001"        │
│ billingId:     "INV/2024/11/001"        │
│ amount:        75,000                   │
│ status:        COMPLETED                │
│ paidAt:        2024-11-05 10:30:00      │
└─────────────────────────────────────────┘
           │
           ▼ UPDATE BILLING
┌─────────────────────────────────────────┐
│ BILLING (UPDATED)                       │
├─────────────────────────────────────────┤
│ billNumber:   "INV/2024/11/001"         │
│ totalAmount:  150,000                   │
│ paidAmount:   75,000  ◄── bertambah     │
│ status:       PARTIAL ◄── berubah       │
└─────────────────────────────────────────┘


📅 8 November 2024 - BAYAR CICILAN 2 (LUNAS)
┌─────────────────────────────────────────┐
│ PAYMENT #2                              │
├─────────────────────────────────────────┤
│ paymentNumber: "PAY/2024/11/012"        │
│ billingId:     "INV/2024/11/001"        │
│ amount:        75,000                   │
│ status:        COMPLETED                │
│ paidAt:        2024-11-08 14:20:00      │
└─────────────────────────────────────────┘
           │
           ▼ UPDATE BILLING
┌─────────────────────────────────────────┐
│ BILLING (FINAL)                         │
├─────────────────────────────────────────┤
│ billNumber:   "INV/2024/11/001"         │
│ totalAmount:  150,000                   │
│ paidAmount:   150,000 ◄── LUNAS         │
│ status:       PAID ✅  ◄── LUNAS        │
└─────────────────────────────────────────┘
```

### Scenario: Andi Belum Bayar SPP (Menunggak)

```
📅 1 November 2024 - GENERATE TAGIHAN
┌─────────────────────────────────────────┐
│ BILLING                                 │
├─────────────────────────────────────────┤
│ billNumber:   "INV/2024/11/025"         │
│ studentId:    "andi-uuid"               │
│ type:         SPP                       │
│ month:        11                        │
│ totalAmount:  175,000  (Kelas 8)        │
│ paidAmount:   0                         │
│ status:       BILLED                    │
│ dueDate:      2024-11-10                │
└─────────────────────────────────────────┘


📅 11 November 2024 - LEWAT JATUH TEMPO (Cron Job)
┌─────────────────────────────────────────┐
│ BILLING (UPDATED)                       │
├─────────────────────────────────────────┤
│ billNumber:   "INV/2024/11/025"         │
│ status:       OVERDUE ❌                │
│ dueDate:      2024-11-10 (LEWAT!)       │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ NOTIFICATION                            │
├─────────────────────────────────────────┤
│ Send WA ke Andi:                        │
│ "SPP November belum dibayar.            │
│  Jatuh tempo: 10 Nov.                   │
│  Tunggakan: Rp 175.000"                 │
└─────────────────────────────────────────┘
```

---

## 4. DASHBOARD QUERIES

### Query 1: Siswa yang Menunggak
```sql
SELECT 
  s.nama,
  s.nisn,
  b.billNumber,
  b.month,
  b.year,
  b.totalAmount,
  b.paidAmount,
  (b.totalAmount - b.paidAmount) as tunggakan,
  b.dueDate
FROM billings b
JOIN students s ON b.student_id = s.id
WHERE b.status IN ('OVERDUE', 'BILLED', 'PARTIAL')
ORDER BY b.dueDate ASC
```

### Query 2: Total Tunggakan Per Bulan
```sql
SELECT 
  month,
  year,
  COUNT(*) as jumlah_tagihan,
  SUM(totalAmount) as total_tagihan,
  SUM(paidAmount) as total_terbayar,
  SUM(totalAmount - paidAmount) as total_tunggakan
FROM billings
WHERE status IN ('BILLED', 'OVERDUE', 'PARTIAL')
  AND academic_year_id = '2024-2025-uuid'
GROUP BY month, year
ORDER BY year, month
```

### Query 3: Laporan Pemasukan Bulan Ini
```sql
SELECT 
  DATE(p.paidAt) as tanggal,
  COUNT(*) as jumlah_pembayaran,
  SUM(p.amount) as total_pemasukan,
  SUM(p.adminFee) as total_admin_fee
FROM payments p
WHERE p.status = 'COMPLETED'
  AND EXTRACT(MONTH FROM p.paidAt) = 11
  AND EXTRACT(YEAR FROM p.paidAt) = 2024
GROUP BY DATE(p.paidAt)
ORDER BY tanggal DESC
```

---

## 5. COMPARISON: LAMA vs BARU

### ❌ SISTEM LAMA
```
Student
  │
  └─► Payment (langsung)
      - bulan: "November 2024" (string)
      - tahunAjaran: "2024/2025" (string)
      - status: PAID/UNPAID

❌ Masalah:
- Tidak bisa tahu SPP bulan apa yang belum dibayar
- Tidak bisa tracking tunggakan
- Tidak bisa cicilan
- Susah laporan per periode
- Tidak scalable
```

### ✅ SISTEM BARU
```
Student
  └─► StudentClass
      └─► Class (tarif SPP berbeda)
          └─► AcademicYear
              └─► Billing (INVOICE)
                  └─► Payment (bisa multiple)
                      └─► PaymentDetail

✅ Keuntungan:
- Ada konsep TAGIHAN terpisah dari PEMBAYARAN
- Bisa tracking tunggakan (status OVERDUE)
- Bisa cicilan (status PARTIAL)
- Laporan lengkap per periode
- Scalable dan profesional
- Audit trail lengkap
```

---

## 6. STATUS TRANSITION DIAGRAM

```
BILLING STATUS FLOW:
┌──────────┐
│ UNBILLED │ (Belum ditagih)
└────┬─────┘
     │ Generate tagihan
     ▼
┌──────────┐
│  BILLED  │ (Sudah ditagih, belum bayar)
└────┬─────┘
     │
     ├─► Bayar sebagian ──► ┌──────────┐
     │                      │ PARTIAL  │ (Cicilan)
     │                      └────┬─────┘
     │                           │
     └─► Bayar lunas ──────►────►┼──► ┌──────────┐
                                 │    │   PAID   │ (Lunas) ✅
                                 │    └──────────┘
                                 │
     ┌───────────────────────────┘
     │ Lewat jatuh tempo
     ▼
┌──────────┐
│ OVERDUE  │ (Menunggak) ❌
└────┬─────┘
     │
     └─► Bisa bayar nanti ──► PARTIAL/PAID


SPECIAL CASES:
┌──────────┐
│ WAIVED   │ (Dibebaskan - beasiswa) 🎓
└──────────┘

┌──────────┐
│CANCELLED │ (Dibatalkan) 🚫
└──────────┘
```

---

## 7. API ENDPOINTS (RECOMMENDED)

```
📋 BILLING (TAGIHAN)
POST   /api/billing/generate        - Generate tagihan untuk siswa/kelas
GET    /api/billing/list            - List tagihan (filter: status, month, year)
GET    /api/billing/:id             - Detail tagihan
GET    /api/billing/student/:id     - Tagihan per siswa
PATCH  /api/billing/:id             - Update tagihan (cancel, waive)
GET    /api/billing/overdue         - List tagihan menunggak

💳 PAYMENT (PEMBAYARAN)
POST   /api/payment/create          - Buat pembayaran
GET    /api/payment/:id             - Detail pembayaran
POST   /api/payment/webhook         - Webhook payment gateway
GET    /api/payment/receipt/:id     - Download bukti pembayaran

📊 REPORTS (LAPORAN)
GET    /api/reports/tunggakan       - Laporan tunggakan
GET    /api/reports/income          - Laporan pemasukan
GET    /api/reports/per-class       - Laporan per kelas
GET    /api/reports/per-month       - Laporan per bulan
GET    /api/reports/export          - Export Excel/PDF

🎓 ACADEMIC (AKADEMIK)
GET    /api/academic/years          - List tahun ajaran
POST   /api/academic/years          - Buat tahun ajaran baru
GET    /api/academic/classes        - List kelas
POST   /api/academic/classes        - Buat kelas baru
POST   /api/academic/assign         - Assign siswa ke kelas
```

---

**📝 Catatan:**  
Diagram ini menunjukkan arsitektur sistem keuangan profesional yang scalable, maintainable, dan sesuai best practice industri.
