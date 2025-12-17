# 📊 BEFORE vs AFTER COMPARISON

Perbandingan visual sistem lama vs sistem baru.

---

## 🗂️ DATABASE SCHEMA

### ❌ SEBELUM (NAIF)

```
┌──────────────┐
│   Student    │
│              │
│ - kelas (str)│ ❌ String, tidak relasi
│ - sppStatus  │ ❌ Status di Student
│ - academicYr │ ❌ String, tidak relasi
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│  SPPPayment  │ ❌ Langsung payment tanpa invoice
│              │
│ - bulan      │ ❌ String "November 2024"
│ - tahunAjaran│ ❌ String "2024/2025"
│ - status     │ ❌ PAID/UNPAID saja
│ - nominal    │
└──────────────┘

❌ MASALAH:
- Tidak ada konsep TAGIHAN/INVOICE
- Tidak bisa tahu SPP bulan apa yang belum dibayar
- Tidak bisa tracking tunggakan per siswa
- SPP sama untuk semua siswa
- Tidak bisa cicilan
- Susah laporan per periode
```

---

### ✅ SESUDAH (PROFESIONAL)

```
┌──────────────┐
│ AcademicYear │ ✅ Entitas terpisah
│ - year       │ ✅ "2024/2025"
│ - isActive   │ ✅ Hanya 1 yang aktif
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│    Class     │ ✅ Kelas dengan tarif
│ - name       │ ✅ "7A", "8A", "9A"
│ - grade      │ ✅ 7, 8, 9
│ - sppAmount  │ ✅ Tarif berbeda per kelas
└──────┬───────┘
       │
       │ N:N (via StudentClass)
       ▼
┌──────────────┐      ┌──────────────┐
│ StudentClass │◄─────│   Student    │
│              │ 1:N  │              │
│ - isActive   │      │ - nisn       │
│ - enrollment │      │ - nama       │
│ - endDate    │      └──────┬───────┘
└──────┬───────┘             │
       │                     │ 1:N
       │                     ▼
       │              ┌──────────────┐
       │              │   Billing    │ ✅ INVOICE/TAGIHAN
       │              │              │
       │              │ - billNumber │ ✅ INV/2024/11/001
       │              │ - month      │ ✅ 11 (integer)
       │              │ - year       │ ✅ 2024 (integer)
       │              │ - totalAmt   │ ✅ Rp 150.000
       │              │ - paidAmt    │ ✅ Rp 0 (tracking)
       │              │ - status     │ ✅ BILLED/PAID/OVERDUE/PARTIAL
       │              │ - dueDate    │ ✅ 2024-11-10
       │              └──────┬───────┘
       │                     │
       │                     │ 1:N
       │                     ▼
       │              ┌──────────────┐
       │              │   Payment    │ ✅ Pembayaran
       │              │              │
       │              │ - paymentNum │ ✅ PAY/2024/11/001
       │              │ - amount     │ ✅ Bisa cicilan!
       │              │ - method     │ ✅ VA/Transfer/Tunai
       │              │ - status     │ ✅ PENDING/COMPLETED
       │              │ - paidAt     │ ✅ Timestamp
       │              └──────┬───────┘
       │                     │
       │                     │ 1:N
       │                     ▼
       │              ┌──────────────┐
       │              │PaymentDetail │ ✅ Breakdown
       │              │              │
       │              │ - description│ ✅ "SPP Nov"
       │              │ - amount     │ ✅ Rp 150.000
       │              └──────────────┘

✅ KEUNTUNGAN:
- Ada konsep TAGIHAN (Billing) terpisah dari PEMBAYARAN (Payment)
- Bisa tracking tunggakan (status OVERDUE)
- Bisa cicilan (status PARTIAL)
- Tarif SPP berbeda per kelas
- Laporan lengkap per periode
- Audit trail professional
```

---

## 📝 DATA EXAMPLES

### ❌ SEBELUM

```javascript
// SPPPayment (LANGSUNG KE PAYMENT, TIDAK ADA INVOICE)
{
  id: "uuid1",
  studentId: "dzaki-uuid",
  bulan: "November 2024",        // ❌ String, susah query
  tahunAjaran: "2024/2025",      // ❌ String, tidak relasi
  nominal: 150000,
  status: "UNPAID",              // ❌ Cuma 2 status
  tanggalBayar: null
}

// PERTANYAAN YANG TIDAK BISA DIJAWAB:
❓ "Dzaki menunggak SPP bulan apa saja?"
   → Susah, harus parsing string "bulan"

❓ "Total tunggakan SPP bulan November semua siswa?"
   → Susah, status cuma PAID/UNPAID

❓ "Dzaki bayar SPP cicil 2x?"
   → Tidak bisa, 1 payment = 1 record

❓ "Laporan SPP per kelas untuk tahun ajaran ini?"
   → Tidak bisa, tidak ada relasi kelas
```

---

### ✅ SESUDAH

```javascript
// 1. BILLING (INVOICE/TAGIHAN)
{
  id: "billing-uuid1",
  billNumber: "INV/2024/11/001",
  studentId: "dzaki-uuid",
  academicYearId: "2024-2025-uuid",  // ✅ Relasi proper
  type: "SPP",
  month: 11,                         // ✅ Integer, mudah query
  year: 2024,                        // ✅ Integer
  totalAmount: 150000,
  paidAmount: 0,                     // ✅ Tracking pembayaran
  status: "BILLED",                  // ✅ UNBILLED/BILLED/PARTIAL/PAID/OVERDUE
  dueDate: "2024-11-10",
  billDate: "2024-11-01"
}

// 2. PAYMENT (PEMBAYARAN) - Bisa multiple!
{
  id: "payment-uuid1",
  paymentNumber: "PAY/2024/11/001",
  billingId: "billing-uuid1",        // ✅ Link ke invoice
  amount: 75000,                     // ✅ Cicilan 1
  method: "VIRTUAL_ACCOUNT",
  status: "COMPLETED",
  paidAt: "2024-11-05 10:30:00"
}

{
  id: "payment-uuid2",
  paymentNumber: "PAY/2024/11/012",
  billingId: "billing-uuid1",        // ✅ Link ke invoice yang sama
  amount: 75000,                     // ✅ Cicilan 2
  method: "VIRTUAL_ACCOUNT",
  status: "COMPLETED",
  paidAt: "2024-11-08 14:20:00"
}

// Billing.paidAmount akan update otomatis:
// After payment 1: paidAmount = 75000, status = PARTIAL
// After payment 2: paidAmount = 150000, status = PAID

// PERTANYAAN YANG SEKARANG BISA DIJAWAB:
✅ "Dzaki menunggak SPP bulan apa saja?"
SELECT * FROM billings 
WHERE student_id = 'dzaki-uuid' 
AND status IN ('BILLED', 'OVERDUE')

✅ "Total tunggakan SPP bulan November semua siswa?"
SELECT SUM(totalAmount - paidAmount) 
FROM billings 
WHERE month = 11 AND year = 2024 
AND status != 'PAID'

✅ "Dzaki bayar SPP cicil 2x?"
SELECT * FROM payments 
WHERE billing_id = 'billing-uuid1'
-- Result: 2 records (cicilan 1 & 2)

✅ "Laporan SPP per kelas untuk tahun ajaran ini?"
SELECT c.name, COUNT(*), SUM(b.totalAmount) 
FROM billings b
JOIN students s ON b.student_id = s.id
JOIN student_classes sc ON s.id = sc.student_id
JOIN classes c ON sc.class_id = c.id
WHERE b.academic_year_id = '2024-2025-uuid'
GROUP BY c.name
```

---

## 🔍 QUERY COMPARISON

### Query 1: List Siswa yang Menunggak

#### ❌ SEBELUM (SUSAH)
```sql
-- Tidak ada status OVERDUE, susah tahu tunggakan
SELECT s.nama, sp.bulan, sp.nominal
FROM students s
JOIN spp_payments sp ON s.id = sp.student_id
WHERE sp.status = 'UNPAID'  -- Tapi tidak tahu sudah lewat jatuh tempo atau belum
ORDER BY sp.created_at
```

#### ✅ SESUDAH (MUDAH)
```sql
-- Ada status OVERDUE, langsung ketahuan
SELECT 
  s.nama,
  s.nisn,
  b.bill_number,
  b.month,
  b.year,
  b.total_amount,
  b.paid_amount,
  (b.total_amount - b.paid_amount) as tunggakan,
  b.due_date,
  DATEDIFF(NOW(), b.due_date) as days_overdue
FROM billings b
JOIN students s ON b.student_id = s.id
WHERE b.status = 'OVERDUE'
ORDER BY b.due_date ASC
```

---

### Query 2: Total Pemasukan Bulan Ini

#### ❌ SEBELUM (TIDAK AKURAT)
```sql
-- Hanya bisa hitung dari SPPPayment yang PAID
-- Tidak ada breakdown biaya admin, dll
SELECT 
  SUM(nominal) as total
FROM spp_payments
WHERE status = 'PAID'
AND MONTH(tanggal_bayar) = 11
AND YEAR(tanggal_bayar) = 2024
```

#### ✅ SESUDAH (AKURAT)
```sql
-- Bisa breakdown payment amount, admin fee, dll
SELECT 
  COUNT(*) as jumlah_pembayaran,
  SUM(amount) as total_payment,
  SUM(admin_fee) as total_admin_fee,
  SUM(total_paid) as total_pemasukan
FROM payments
WHERE status = 'COMPLETED'
AND MONTH(paid_at) = 11
AND YEAR(paid_at) = 2024
```

---

### Query 3: Laporan per Kelas

#### ❌ SEBELUM (TIDAK BISA)
```sql
-- Tidak ada relasi Class, kelas cuma string di Student
-- Tidak bisa laporan per kelas dengan accurate
SELECT 
  s.kelas,  -- ❌ String "7A", "8A", dll
  COUNT(*) as jumlah,
  SUM(sp.nominal) as total
FROM students s
JOIN spp_payments sp ON s.id = sp.student_id
WHERE sp.status = 'PAID'
GROUP BY s.kelas  -- ❌ Tidak reliable
```

#### ✅ SESUDAH (PROFESIONAL)
```sql
-- Ada entitas Class dengan relasi proper
SELECT 
  c.name as kelas,
  c.grade,
  c.spp_amount as tarif_per_bulan,
  COUNT(DISTINCT b.id) as jumlah_tagihan,
  COUNT(DISTINCT CASE WHEN b.status = 'PAID' THEN b.id END) as lunas,
  COUNT(DISTINCT CASE WHEN b.status = 'OVERDUE' THEN b.id END) as menunggak,
  SUM(b.total_amount) as total_tagihan,
  SUM(b.paid_amount) as total_terbayar
FROM classes c
JOIN student_classes sc ON c.id = sc.class_id
JOIN students s ON sc.student_id = s.id
JOIN billings b ON s.id = b.student_id
WHERE sc.is_active = true
AND b.academic_year_id = '2024-2025-uuid'
GROUP BY c.id, c.name, c.grade, c.spp_amount
ORDER BY c.grade, c.name
```

---

## 📊 UI COMPARISON

### ❌ SEBELUM - Student Dashboard

```
┌──────────────────────────────┐
│   Dashboard Siswa            │
├──────────────────────────────┤
│ Status SPP: UNPAID ❌        │ ← Tidak detail bulan apa
│                              │
│ History:                     │
│ - Sept 2024: PAID            │ ← String, tidak structured
│ - Okt 2024: PAID             │
│ - Nov 2024: UNPAID           │ ← Tidak tahu jatuh tempo kapan
│                              │
│ [Bayar SPP]                  │ ← Bayar apa? Tidak jelas
└──────────────────────────────┘
```

### ✅ SESUDAH - Student Dashboard

```
┌──────────────────────────────────────────┐
│   Dashboard Siswa                        │
├──────────────────────────────────────────┤
│ ⚠️ PERINGATAN:                           │
│ Anda memiliki 2 tagihan yang menunggak   │
│                                          │
│ Tagihan Belum Dibayar:                   │
├──────────────────────────────────────────┤
│ 📄 INV/2024/11/001                       │
│ SPP November 2024                        │
│ Rp 150.000 | Jatuh tempo: 10 Nov ❌     │ ← Jelas & detail
│ Status: OVERDUE (7 hari)                 │
│ [Bayar Sekarang]                         │
├──────────────────────────────────────────┤
│ 📄 INV/2024/12/001                       │
│ SPP Desember 2024                        │
│ Rp 150.000 | Jatuh tempo: 10 Des        │
│ Status: BILLED                           │
│ [Bayar Sekarang]                         │
├──────────────────────────────────────────┤
│ 📄 INV/2024/01/015                       │
│ Daftar Ulang TA 2024/2025                │
│ Rp 500.000 | Dibayar: Rp 300.000        │ ← Bisa cicilan!
│ Status: PARTIAL (Kurang Rp 200.000)     │
│ [Lanjut Bayar]                           │
├──────────────────────────────────────────┤
│ History Pembayaran:                      │
│ ✅ Okt 2024: PAID (05 Nov 10:30)        │ ← Detail timestamp
│ ✅ Sept 2024: PAID (03 Okt 14:20)       │
└──────────────────────────────────────────┘
```

---

### ❌ SEBELUM - Treasurer Dashboard

```
┌──────────────────────────────┐
│   Dashboard Bendahara        │
├──────────────────────────────┤
│ Total Siswa: 150             │
│ SPP Terbayar: 120            │ ← Tidak detail bulan apa
│ SPP Belum: 30                │ ← Tidak tahu tunggakan
│                              │
│ Pemasukan Hari Ini:          │
│ Rp 3.000.000                 │ ← Dari mana? Tidak jelas
└──────────────────────────────┘
```

### ✅ SESUDAH - Treasurer Dashboard

```
┌───────────────────────────────────────────────┐
│   Dashboard Bendahara - November 2024         │
├───────────────────────────────────────────────┤
│ STATISTIK:                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ SISWA    │ │ TAGIHAN  │ │ TUNGGAKAN│      │
│ │   150    │ │   145    │ │    28    │      │ ← Clear!
│ │  Aktif   │ │  Bulan   │ │ OVERDUE  │      │
│ └──────────┘ └──────────┘ └──────────┘      │
│                                               │
│ PEMASUKAN:                                    │
│ ┌─────────────────┐ ┌─────────────────┐     │
│ │ Hari Ini        │ │ Bulan Ini       │     │
│ │ Rp 2.850.000    │ │ Rp 18.750.000   │     │
│ │ 19 pembayaran   │ │ 125 pembayaran  │     │ ← Detail
│ └─────────────────┘ └─────────────────┘     │
│                                               │
│ BREAKDOWN TAGIHAN NOVEMBER:                   │
│ ✅ Lunas: 110 siswa (Rp 16.500.000)          │
│ ⚠️ Cicilan: 7 siswa (Rp 525.000 terbayar)    │
│ ❌ Menunggak: 28 siswa (Rp 4.200.000)        │ ← Jelas!
│ ⏳ Belum ditagih: 5 siswa                     │
│                                               │
│ SISWA MENUNGGAK: [Lihat Detail]               │
│ 1. Dzaki (7A) - Nov, Des (Rp 300.000)        │
│ 2. Andi (8B) - Nov (Rp 175.000)              │
│ ... [28 siswa total]                          │
│                                               │
│ [Generate Tagihan Des] [Export Laporan]      │
└───────────────────────────────────────────────┘
```

---

## 🎯 BUSINESS LOGIC COMPARISON

### Scenario: Siswa Bayar SPP Cicil

#### ❌ SEBELUM (TIDAK BISA)
```
User Story: Dzaki mau bayar SPP Rp 150.000 tapi dicicil 2x

System Response:
❌ Tidak support cicilan
❌ Harus bayar lunas Rp 150.000
❌ 1 payment = 1 record = full amount

Alternative (workaround):
- Buat 2 SPPPayment terpisah dengan nominal dibagi 2
- ❌ Tapi tidak ada relasi, tidak tahu ini 1 tagihan
- ❌ Laporan jadi salah (seolah 2 tagihan berbeda)
```

#### ✅ SESUDAH (BISA!)
```
User Story: Dzaki mau bayar SPP Rp 150.000 tapi dicicil 2x

System Response:
✅ Support cicilan out of the box

Flow:
1. Billing dibuat: INV/2024/11/001
   - totalAmount: 150.000
   - paidAmount: 0
   - status: BILLED

2. Payment 1: PAY/2024/11/001
   - billingId: INV/2024/11/001
   - amount: 75.000
   - status: COMPLETED
   
   → Billing update:
   - paidAmount: 75.000
   - status: PARTIAL ✅

3. Payment 2: PAY/2024/11/012
   - billingId: INV/2024/11/001
   - amount: 75.000
   - status: COMPLETED
   
   → Billing update:
   - paidAmount: 150.000
   - status: PAID ✅

✅ Laporan benar: 1 tagihan, 2 pembayaran
✅ History jelas: Dzaki bayar cicil 2x
✅ Audit trail lengkap
```

---

## 🏆 KESIMPULAN

| Aspek | ❌ Sebelum | ✅ Sesudah |
|-------|-----------|-----------|
| **Konsep** | Payment langsung | Billing → Payment (proper) |
| **Status** | 2 status (PAID/UNPAID) | 7 status (UNBILLED/BILLED/PARTIAL/PAID/OVERDUE/CANCELLED/WAIVED) |
| **Tunggakan** | Tidak bisa tracking | Status OVERDUE otomatis |
| **Cicilan** | Tidak support | Full support dengan status PARTIAL |
| **Tahun Ajaran** | String | Relasi ke AcademicYear |
| **Kelas** | String di Student | Entitas Class dengan tarif |
| **Tarif SPP** | Sama untuk semua | Berbeda per kelas |
| **Laporan** | Terbatas | Lengkap per periode/kelas/siswa |
| **Audit** | Minimal | Professional audit trail |
| **Scalability** | ❌ Tidak scalable | ✅ Sangat scalable |
| **Production Ready** | ❌ Tidak | ✅ Ya |

---

**Kesimpulan Akhir:**

### ❌ SISTEM LAMA = CRUD Sederhana
- Cocok untuk: Prototype, demo kecil
- Tidak cocok untuk: Production, sistem sekolah real

### ✅ SISTEM BARU = Professional Payment System
- Cocok untuk: Production, TA, portfolio
- Mengikuti: Best practice industri
- Siap: Audit, scaling, growth

---

**Last Updated:** 17 Desember 2024  
**Conclusion:** Refactoring ini bukan "sekadar nambahin tabel", tapi **complete re-architecture** dari sistem yang naive menjadi sistem yang professional! 🚀
