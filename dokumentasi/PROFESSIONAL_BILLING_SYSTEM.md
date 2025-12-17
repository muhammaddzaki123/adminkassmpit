# 🏦 SISTEM KEUANGAN PROFESIONAL - KASSMPIT

## 📋 RINGKASAN PERUBAHAN

Sistem pembayaran SPP telah direfaktor sesuai **standar sistem keuangan sekolah profesional**. Perubahan ini mengatasi red flag desain database yang tidak scalable dan sulit di-audit.

---

## ❌ MASALAH LAMA (RED FLAGS)

### 1. Tidak Ada Konsep TAGIHAN (Invoice)
**Sebelum:** `Student → Payment` (langsung)  
**Masalah:** Tidak bisa tracking tunggakan, tidak bisa tahu SPP bulan apa, tidak bisa audit

### 2. Pembayaran Tidak Terikat Tahun Ajaran
**Sebelum:** `Payment` berdiri sendiri, tidak ada `academicYearId`  
**Masalah:** Sulit laporan per semester/tahun, tidak scalable

### 3. Tidak Ada Relasi Kelas → Siswa → Tagihan
**Sebelum:** Tidak ada entitas `Class`, SPP sama untuk semua  
**Masalah:** SPP harusnya berbeda per tingkat (Kelas 7, 8, 9)

### 4. Enum Status Terlalu Sederhana
**Sebelum:** `PAID | UNPAID | PENDING`  
**Masalah:** Tidak bisa handle cicilan, tunggakan, pembebasan

### 5. Tidak Ada Payment Detail
**Sebelum:** 1 payment = 1 transaksi flat  
**Masalah:** Tidak bisa bayar cicil, tidak bisa breakdown biaya

---

## ✅ SOLUSI PROFESIONAL

### 🔑 Arsitektur Baru

```
Student
 └─ StudentClass (history enrollment)
     └─ Class (tarif SPP per kelas)
         └─ AcademicYear (tahun ajaran)
             └─ Billing (INVOICE/TAGIHAN)
                 └─ Payment (PEMBAYARAN)
                     └─ PaymentDetail (breakdown)
```

---

## 🗂️ ENTITAS BARU (PROFESIONAL)

### 1️⃣ **AcademicYear** (Tahun Ajaran)
```prisma
model AcademicYear {
  id            String    @id @default(uuid())
  year          String    @unique // "2024/2025"
  startDate     DateTime
  endDate       DateTime
  isActive      Boolean   @default(false) // Hanya 1 yang aktif
  
  studentClasses StudentClass[]
  billings       Billing[]
  registrations  NewStudent[]
}
```

**Kegunaan:**
- Segmentasi data per tahun ajaran
- Laporan keuangan per periode
- Archive data tahun lalu

---

### 2️⃣ **Class** (Kelas/Tingkat)
```prisma
model Class {
  id            String    @id @default(uuid())
  name          String    // "7A", "7B", "8A"
  grade         Int       // 7, 8, 9
  sppAmount     Float     // Tarif SPP bulanan
  maxCapacity   Int?
  waliKelas     String?
  
  studentClasses StudentClass[]
  billingTemplates BillingTemplate[]
}
```

**Kegunaan:**
- Tarif SPP berbeda per kelas
- Contoh:
  - Kelas 7: Rp 150.000
  - Kelas 8: Rp 175.000
  - Kelas 9: Rp 200.000

---

### 3️⃣ **StudentClass** (History Enrollment)
```prisma
model StudentClass {
  id              String       @id @default(uuid())
  studentId       String
  student         Student      @relation(...)
  classId         String
  class           Class        @relation(...)
  academicYearId  String
  academicYear    AcademicYear @relation(...)
  
  enrollmentDate  DateTime
  endDate         DateTime?    // Null jika masih aktif
  isActive        Boolean
}
```

**Kegunaan:**
- Track siswa di kelas apa per tahun ajaran
- History kelas siswa dari tahun ke tahun
- Bisa tahu siswa pindah kelas/naik kelas kapan

**Contoh Data:**
```
Dzaki → Kelas 7A → TA 2023/2024 → (active)
Dzaki → Kelas 8A → TA 2024/2025 → (active)
```

---

### 4️⃣ **BillingTemplate** & **BillingItem**
```prisma
model BillingTemplate {
  id            String    @id @default(uuid())
  name          String    // "SPP Kelas 7", "Uang Gedung"
  type          PaymentType
  classId       String?   // Null = berlaku semua kelas
  class         Class?
  amount        Float
  isRecurring   Boolean   // true untuk SPP bulanan
  
  billingItems  BillingItem[]
}

model BillingItem {
  id                  String
  billingTemplateId   String
  billingTemplate     BillingTemplate
  name                String    // "SPP November", "Biaya Lab"
  amount              Float
  quantity            Int
  isOptional          Boolean
}
```

**Kegunaan:**
- Template untuk generate tagihan otomatis
- Breakdown item tagihan (SPP + Lab + Ekskul)
- Bisa customize per kelas

---

### 5️⃣ **Billing** (INVOICE/TAGIHAN) ⭐ PALING PENTING!
```prisma
model Billing {
  id              String        @id @default(uuid())
  billNumber      String        @unique // "INV/2024/11/001"
  
  studentId       String
  student         Student
  
  academicYearId  String
  academicYear    AcademicYear
  
  type            PaymentType   // SPP, UANG_GEDUNG, dll
  month           Int?          // 1-12 untuk SPP
  year            Int
  
  subtotal        Float         // Total sebelum diskon
  discount        Float
  totalAmount     Float         // Total yang harus dibayar
  paidAmount      Float         // Total sudah dibayar
  
  status          BillingStatus // UNBILLED, BILLED, PARTIAL, PAID, OVERDUE
  dueDate         DateTime      // Jatuh tempo
  billDate        DateTime
  
  payments        Payment[]
}
```

**Enum BillingStatus:**
```prisma
enum BillingStatus {
  UNBILLED    // Belum ditagih
  BILLED      // Sudah ditagih, belum bayar
  PARTIAL     // Dibayar sebagian (cicilan)
  PAID        // Lunas
  OVERDUE     // Terlambat/menunggak
  CANCELLED   // Dibatalkan
  WAIVED      // Dibebaskan (beasiswa)
}
```

**Kegunaan:**
- **TAGIHAN TERPISAH DARI PEMBAYARAN** ✅
- Bisa tracking tunggakan
- Bisa tahu SPP bulan apa yang belum dibayar
- Status OVERDUE otomatis jika lewat dueDate
- Status PARTIAL untuk cicilan
- Laporan keuangan akurat

**Contoh Data:**
```
INV/2024/11/001 → Dzaki → SPP November 2024 → Rp 150.000 → BILLED
INV/2024/12/002 → Dzaki → SPP Desember 2024 → Rp 150.000 → PAID
INV/2024/11/003 → Andi  → SPP November 2024 → Rp 150.000 → OVERDUE
```

---

### 6️⃣ **Payment** (Pembayaran)
```prisma
model Payment {
  id              String        @id @default(uuid())
  paymentNumber   String        @unique // "PAY/2024/11/001"
  
  billingId       String        // ⭐ Link ke tagihan
  billing         Billing
  
  method          PaymentMethod
  amount          Float         // Bisa cicilan!
  adminFee        Float
  totalPaid       Float         // amount + adminFee
  
  status          PaymentStatus // PENDING, COMPLETED, FAILED, etc
  
  // Payment gateway
  externalId      String?
  vaNumber        String?
  qrCode          String?
  
  expiredAt       DateTime?
  paidAt          DateTime?
  
  receiptUrl      String?
  processedBy     String?       // User ID bendahara
  
  details         PaymentDetail[]
}
```

**Enum PaymentStatus:**
```prisma
enum PaymentStatus {
  PENDING       // Menunggu pembayaran
  PROCESSING    // Sedang diproses
  COMPLETED     // Pembayaran berhasil
  FAILED        // Pembayaran gagal
  EXPIRED       // Kadaluarsa
  REFUNDED      // Dikembalikan
}
```

**Kegunaan:**
- Link ke Billing (bukan langsung ke Student!)
- Bisa bayar cicilan (amount < billing.totalAmount)
- Tracking metode pembayaran
- Integration dengan payment gateway

**Contoh Cicilan:**
```
Billing INV/001 → Total Rp 500.000
  Payment PAY/001 → Rp 200.000 (cicilan 1) → Billing status = PARTIAL
  Payment PAY/002 → Rp 150.000 (cicilan 2) → Billing status = PARTIAL
  Payment PAY/003 → Rp 150.000 (cicilan 3) → Billing status = PAID
```

---

### 7️⃣ **PaymentDetail** (Breakdown Pembayaran)
```prisma
model PaymentDetail {
  id            String
  paymentId     String
  payment       Payment
  
  description   String    // "SPP November", "Biaya Admin"
  amount        Float
  notes         String?
}
```

**Kegunaan:**
- Breakdown pembayaran
- Contoh: SPP Rp 150.000 + Admin Rp 2.500

---

## 📊 WORKFLOW PEMBAYARAN (PROFESIONAL)

### Alur Sistem Baru:

```
1. BUAT TAGIHAN (Generate Billing)
   Admin → Buat tagihan SPP untuk semua siswa kelas 7 bulan November
   
2. SISWA LIHAT TAGIHAN
   Siswa login → Dashboard → Lihat tagihan yang BILLED/OVERDUE
   
3. SISWA BAYAR
   Siswa pilih tagihan → Pilih metode pembayaran → Bayar
   
4. SISTEM UPDATE
   Payment dibuat → Billing.paidAmount bertambah
   
   Jika paidAmount == totalAmount → Status = PAID
   Jika paidAmount < totalAmount → Status = PARTIAL
   Jika lewat dueDate dan belum PAID → Status = OVERDUE
   
5. LAPORAN
   Admin bisa lihat:
   - Siswa mana yang OVERDUE (menunggak)
   - Berapa total tunggakan per bulan
   - Laporan pemasukan per bulan/semester/tahun
```

---

## 🔍 QUERY YANG SEKARANG BISA DIJAWAB

### ❓ **"Siswa mana yang menunggak?"**
```prisma
const tunggakan = await prisma.billing.findMany({
  where: {
    status: 'OVERDUE'
  },
  include: {
    student: true
  }
})
```

### ❓ **"Berapa total tunggakan bulan ini?"**
```prisma
const total = await prisma.billing.aggregate({
  where: {
    status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    month: 11,
    year: 2024
  },
  _sum: {
    totalAmount: true,
    paidAmount: true
  }
})

const tunggakan = total._sum.totalAmount - total._sum.paidAmount
```

### ❓ **"Laporan pembayaran SPP per bulan?"**
```prisma
const laporan = await prisma.billing.groupBy({
  by: ['month', 'year', 'status'],
  where: {
    type: 'SPP',
    academicYearId: '...'
  },
  _sum: {
    totalAmount: true,
    paidAmount: true
  },
  _count: true
})
```

### ❓ **"History pembayaran siswa?"**
```prisma
const history = await prisma.billing.findMany({
  where: {
    studentId: '...'
  },
  include: {
    payments: {
      include: {
        details: true
      }
    }
  },
  orderBy: {
    billDate: 'desc'
  }
})
```

### ❓ **"Siswa pindah kelas, bagaimana history pembayaran?"**
```prisma
const studentHistory = await prisma.studentClass.findMany({
  where: {
    studentId: '...'
  },
  include: {
    class: true,
    academicYear: true,
    student: {
      include: {
        billings: {
          where: {
            academicYearId: '...' // Filter per tahun ajaran
          }
        }
      }
    }
  }
})
```

---

## 🎯 KEUNTUNGAN SISTEM BARU

### 1. **Audit Trail Lengkap** ✅
- Semua tagihan tercatat dengan invoice number
- History pembayaran per siswa per tahun ajaran
- Tracking siapa yang approve/process

### 2. **Scalable** ✅
- Tarif SPP berbeda per kelas
- Bisa handle cicilan
- Bisa handle diskon/beasiswa (WAIVED)
- Bisa handle berbagai jenis tagihan

### 3. **Reporting Profesional** ✅
- Laporan tunggakan real-time
- Laporan pemasukan per periode
- Rekap per kelas/tingkat
- Audit keuangan mudah

### 4. **User Experience Baik** ✅
- Siswa bisa lihat tagihan yang belum dibayar
- Siswa bisa lihat history pembayaran
- Admin bisa generate tagihan otomatis
- Bendahara bisa tracking real-time

### 5. **Compliance & Best Practice** ✅
- Sesuai standar sistem keuangan sekolah
- Mudah di-audit oleh dosen/praktisi
- Professional-grade architecture
- Production-ready

---

## 🚀 LANGKAH MIGRASI

### 1. **Apply Migration**
```bash
npx prisma migrate dev --name add_professional_billing_system
```

### 2. **Generate Prisma Client**
```bash
npx prisma generate
```

### 3. **Seed Data Initial**
```bash
# Buat tahun ajaran aktif
# Buat kelas-kelas
# Assign siswa ke kelas
# Generate tagihan SPP bulan berjalan
```

### 4. **Refactor API Endpoints**
```
/api/billing/generate      → Generate tagihan
/api/billing/list          → List tagihan siswa
/api/billing/[id]          → Detail tagihan
/api/payment/create        → Buat pembayaran
/api/payment/webhook       → Webhook payment gateway
/api/reports/tunggakan     → Laporan tunggakan
/api/reports/income        → Laporan pemasukan
```

### 5. **Update UI**
```
- Dashboard siswa: Tampilkan tagihan BILLED/OVERDUE
- Dashboard bendahara: Tampilkan rekap tunggakan
- Halaman pembayaran: Link ke tagihan
- Halaman history: Tampilkan semua billing + payments
```

---

## 📝 CATATAN PENTING

### Model Lama (DEPRECATED)
Model `SPPPayment` dan `Transaction` ditandai **DEPRECATED** dan akan dihapus bertahap.

**Jangan gunakan lagi untuk fitur baru!**

### Model Baru (PROFESIONAL)
Gunakan struktur:
- `AcademicYear`
- `Class`
- `StudentClass`
- `Billing` (Invoice)
- `Payment`
- `PaymentDetail`

---

## 🎓 KESIMPULAN

Refaktor ini bukan sekadar "menambah tabel". Ini adalah **re-arsitektur sistem keuangan** agar:

1. ✅ Sesuai standar profesional
2. ✅ Scalable dan maintainable
3. ✅ Mudah di-audit
4. ✅ Best practice untuk sistem SPP sekolah

**Ini bukan opini pribadi, ini standar industri untuk sistem pembayaran sekolah.**

---

**Dibuat:** 17 Desember 2024  
**Status:** ✅ Schema sudah direfaktor  
**Next:** Apply migration dan refactor API endpoints
