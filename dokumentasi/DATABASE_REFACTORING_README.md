# 🏦 REFACTORING DATABASE - SISTEM KEUANGAN PROFESIONAL

## 📌 SUMMARY

Database schema telah **direfaktor total** untuk mengatasi red flag pada sistem keuangan. Sistem baru mengikuti **standar industri** untuk sistem SPP sekolah yang profesional, scalable, dan mudah di-audit.

---

## ❌ MASALAH YANG DIPERBAIKI

### 1. Tidak Ada Konsep TAGIHAN
**Sebelum:** Payment langsung tanpa Invoice  
**Sekarang:** `Billing` (Invoice) → `Payment` (terpisah) ✅

### 2. Tidak Terikat Tahun Ajaran
**Sebelum:** String `tahunAjaran`  
**Sekarang:** Relasi ke `AcademicYear` ✅

### 3. Tidak Ada Relasi Kelas
**Sebelum:** SPP sama untuk semua siswa  
**Sekarang:** `Class` dengan tarif berbeda per tingkat ✅

### 4. Enum Status Terlalu Sederhana
**Sebelum:** `PAID | UNPAID | PENDING`  
**Sekarang:** `UNBILLED | BILLED | PARTIAL | PAID | OVERDUE | CANCELLED | WAIVED` ✅

### 5. Tidak Ada Payment Breakdown
**Sebelum:** 1 payment flat  
**Sekarang:** `PaymentDetail` untuk cicilan & breakdown ✅

---

## ✅ ENTITAS BARU

### Core Entities (Wajib):
1. **AcademicYear** - Tahun ajaran (2024/2025)
2. **Class** - Kelas dengan tarif SPP berbeda
3. **StudentClass** - History enrollment siswa
4. **BillingTemplate** - Template untuk generate tagihan
5. **BillingItem** - Item breakdown tagihan
6. **Billing** - INVOICE/TAGIHAN (⭐ paling penting!)
7. **Payment** - Pembayaran (bisa multiple per billing)
8. **PaymentDetail** - Breakdown pembayaran

### Relasi (Profesional):
```
Student
 └─ StudentClass
     └─ Class (tarif SPP)
         └─ AcademicYear
             └─ Billing (INVOICE)
                 └─ Payment (bisa cicilan)
                     └─ PaymentDetail
```

---

## 📊 KEUNTUNGAN SISTEM BARU

### 1. Audit Trail Lengkap ✅
- Invoice number untuk setiap tagihan
- History pembayaran per siswa
- Tracking approval dan proses

### 2. Scalable ✅
- Tarif berbeda per kelas
- Handle cicilan
- Handle diskon/beasiswa
- Multiple jenis tagihan

### 3. Reporting Profesional ✅
- Laporan tunggakan real-time
- Laporan pemasukan per periode
- Rekap per kelas
- Audit keuangan mudah

### 4. Best Practice ✅
- Sesuai standar sistem keuangan sekolah
- Production-ready architecture
- Mudah di-maintain

---

## 📖 DOKUMENTASI

### 📄 File Dokumentasi:

1. **[PROFESSIONAL_BILLING_SYSTEM.md](PROFESSIONAL_BILLING_SYSTEM.md)**
   - Penjelasan lengkap sistem baru
   - Query examples
   - Workflow pembayaran
   - FAQ dan troubleshooting

2. **[BILLING_SYSTEM_DIAGRAM.md](BILLING_SYSTEM_DIAGRAM.md)**
   - ERD diagram
   - Workflow diagram
   - Status transition
   - API endpoints recommendation
   - Contoh data flow

3. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**
   - Step-by-step migration
   - Data migration scripts
   - API refactoring guide
   - Verification checklist
   - Troubleshooting

4. **[prisma/schema.prisma](prisma/schema.prisma)**
   - Database schema lengkap
   - Enum definitions
   - Relasi antar model

---

## 🚀 QUICK START

### 1. Apply Migration
```bash
# Backup database dulu!
pg_dump -h host -U user -d db > backup.sql

# Apply migration
npx prisma migrate dev --name add_professional_billing_system

# Generate client
npx prisma generate
```

### 2. Seed Initial Data
```bash
# Buat tahun ajaran & kelas
npx ts-node prisma/seed-billing-system.ts
```

### 3. Migrate Existing Data
```bash
# Migrate students ke StudentClass
npx ts-node scripts/migrate-students-to-class.ts

# Migrate SPPPayment ke Billing + Payment
npx ts-node scripts/migrate-spp-to-billing.ts

# Verify
npx ts-node scripts/verify-migration.ts
```

### 4. Test
```bash
# Start development server
npm run dev

# Test endpoints
curl http://localhost:3000/api/billing/list
```

---

## 🔍 CONTOH QUERY

### Siswa yang Menunggak
```typescript
const tunggakan = await prisma.billing.findMany({
  where: { status: 'OVERDUE' },
  include: { student: true }
})
```

### Total Tunggakan Bulan Ini
```typescript
const total = await prisma.billing.aggregate({
  where: {
    status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] },
    month: 12,
    year: 2024
  },
  _sum: {
    totalAmount: true,
    paidAmount: true
  }
})

const tunggakan = total._sum.totalAmount - total._sum.paidAmount
```

### History Pembayaran Siswa
```typescript
const history = await prisma.billing.findMany({
  where: { studentId: 'xxx' },
  include: {
    payments: {
      include: { details: true }
    }
  },
  orderBy: { billDate: 'desc' }
})
```

---

## ⚠️ DEPRECATION NOTICE

### Model Lama (DEPRECATED):
- ❌ `SPPPayment` - Gunakan `Billing` + `Payment`
- ❌ `Transaction` (old) - Gunakan `Payment`

**Model ini ditandai DEPRECATED dan akan dihapus secara bertahap.**

### Timeline Removal:
```
Week 1-8:   Migration & refactoring
Week 9-12:  Testing & monitoring
Week 13+:   Remove old models (jika usage = 0)
```

---

## 📞 SUPPORT & REFERENCES

### Jika Ada Masalah:
1. Baca dokumentasi lengkap di file MD
2. Run verification script
3. Check error logs
4. Rollback jika perlu

### Standards & References:
- Sistem keuangan sekolah standar industri
- Best practice payment system architecture
- Audit-ready database design
- Production-grade schema

---

## ✅ CHECKLIST IMPLEMENTASI

- [x] Refactor schema.prisma
- [x] Tambah entitas profesional (8 models baru)
- [x] Update enum status
- [x] Buat dokumentasi lengkap
- [x] Buat migration guide
- [x] Buat diagram visual
- [ ] Apply migration ke database
- [ ] Seed initial data
- [ ] Migrate existing data
- [ ] Refactor API endpoints
- [ ] Update UI components
- [ ] Testing
- [ ] Deploy to production

---

## 🎯 KESIMPULAN

Ini bukan sekadar "nambahin tabel". Ini adalah **re-arsitektur sistem keuangan** yang:

1. ✅ Mengikuti standar profesional
2. ✅ Scalable dan maintainable
3. ✅ Audit-ready
4. ✅ Production-grade
5. ✅ Best practice industri

**Sistem ini bisa digunakan untuk TA, portfolio, atau production.**

---

**Dibuat:** 17 Desember 2024  
**Status:** ✅ Schema refactoring complete  
**Next Action:** Apply migration & migrate data  
**Maintainer:** Team KASSMPIT
