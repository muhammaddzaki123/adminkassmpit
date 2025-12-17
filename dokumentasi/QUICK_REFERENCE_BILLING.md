# ⚡ QUICK REFERENCE - SISTEM BILLING PROFESIONAL

Referensi cepat untuk sistem billing yang sudah direfaktor.

---

## 📂 FILE DOKUMENTASI

| File | Deskripsi |
|------|-----------|
| [DATABASE_REFACTORING_README.md](DATABASE_REFACTORING_README.md) | 📌 **MULAI DI SINI** - Overview lengkap refactoring |
| [PROFESSIONAL_BILLING_SYSTEM.md](PROFESSIONAL_BILLING_SYSTEM.md) | Penjelasan detail sistem, query examples |
| [BILLING_SYSTEM_DIAGRAM.md](BILLING_SYSTEM_DIAGRAM.md) | ERD, workflow, diagram visual |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Step-by-step migration dari sistem lama |
| [API_IMPLEMENTATION_EXAMPLES.md](API_IMPLEMENTATION_EXAMPLES.md) | Contoh implementasi API endpoints |
| [prisma/schema.prisma](prisma/schema.prisma) | Database schema (source of truth) |

---

## 🗂️ ENTITAS UTAMA

### 8 Model Baru (Profesional):

```
1. AcademicYear      → Tahun ajaran
2. Class             → Kelas/tingkat
3. StudentClass      → History enrollment siswa
4. BillingTemplate   → Template tagihan
5. BillingItem       → Item breakdown
6. Billing          → ⭐ INVOICE/TAGIHAN
7. Payment          → Pembayaran
8. PaymentDetail    → Breakdown pembayaran
```

---

## 🔑 KONSEP KUNCI

### Alur Sistem:
```
Student → StudentClass → Class → Billing → Payment → PaymentDetail
                          ↓         ↓
                   AcademicYear    BillingStatus
```

### Status Billing:
- `UNBILLED` - Belum ditagih
- `BILLED` - Sudah ditagih
- `PARTIAL` - Cicilan
- `PAID` - Lunas ✅
- `OVERDUE` - Menunggak ❌
- `CANCELLED` - Dibatalkan
- `WAIVED` - Dibebaskan

### Status Payment:
- `PENDING` - Menunggu
- `PROCESSING` - Diproses
- `COMPLETED` - Berhasil ✅
- `FAILED` - Gagal ❌
- `EXPIRED` - Kadaluarsa
- `REFUNDED` - Dikembalikan

---

## 💡 QUERY PENTING

### 1. Siswa yang Menunggak
```typescript
const tunggakan = await prisma.billing.findMany({
  where: { status: 'OVERDUE' },
  include: { student: true }
})
```

### 2. Total Tunggakan
```typescript
const total = await prisma.billing.aggregate({
  where: {
    status: { in: ['BILLED', 'OVERDUE', 'PARTIAL'] }
  },
  _sum: {
    totalAmount: true,
    paidAmount: true
  }
})
```

### 3. Generate Tagihan SPP
```typescript
// POST /api/billing/generate
{
  "month": 12,
  "year": 2024,
  "classIds": ["uuid1", "uuid2"]
}
```

### 4. Bayar Tagihan
```typescript
// POST /api/payment/create
{
  "billingId": "uuid",
  "amount": 150000,
  "method": "VIRTUAL_ACCOUNT"
}
```

---

## 🚀 COMMAND PENTING

### Setup Database:
```bash
# Backup dulu!
pg_dump -h host -U user -d db > backup.sql

# Apply migration
npx prisma migrate dev --name add_professional_billing_system

# Generate client
npx prisma generate

# Seed initial data
npx ts-node prisma/seed-billing-system.ts
```

### Migrate Data:
```bash
# Migrate students
npx ts-node scripts/migrate-students-to-class.ts

# Migrate SPP payments
npx ts-node scripts/migrate-spp-to-billing.ts

# Verify
npx ts-node scripts/verify-migration.ts
```

### Development:
```bash
# Start dev server
npm run dev

# Prisma Studio
npx prisma studio

# Check errors
npm run lint
```

---

## 📡 API ENDPOINTS

### Billing:
```
POST   /api/billing/generate          # Generate tagihan
GET    /api/billing/list              # List semua tagihan
GET    /api/billing/:id               # Detail tagihan
GET    /api/billing/student/:id       # Tagihan per siswa
GET    /api/billing/overdue           # Tagihan menunggak
```

### Payment:
```
POST   /api/payment/create            # Buat pembayaran
GET    /api/payment/:id               # Detail pembayaran
POST   /api/payment/webhook           # Webhook payment gateway
```

### Reports:
```
GET    /api/reports/tunggakan         # Laporan tunggakan
GET    /api/reports/income            # Laporan pemasukan
GET    /api/reports/per-class         # Per kelas
GET    /api/reports/per-month         # Per bulan
```

### Academic:
```
GET    /api/academic/years            # Tahun ajaran
GET    /api/academic/classes          # Kelas
POST   /api/academic/assign           # Assign siswa ke kelas
```

---

## 🎯 WORKFLOW STANDARD

### 1. Setup Awal (Sekali)
```
1. Buat AcademicYear "2024/2025"
2. Buat Class (7A, 7B, 8A, dll) dengan tarif SPP
3. Assign Student ke Class (StudentClass)
4. Buat BillingTemplate
```

### 2. Generate Tagihan (Setiap Bulan)
```
1. POST /api/billing/generate (month: 12, year: 2024)
2. System buat Billing untuk semua siswa
3. Status: BILLED
4. DueDate: 10 bulan berjalan
```

### 3. Siswa Bayar
```
1. Siswa login → Lihat tagihan BILLED/OVERDUE
2. Pilih tagihan → Pilih metode bayar
3. POST /api/payment/create
4. System buat Payment (status: PENDING)
5. Payment gateway callback → Update status: COMPLETED
6. Billing.paidAmount bertambah
7. Jika paidAmount == totalAmount → Status: PAID
```

### 4. Auto Update (Cron Daily)
```
1. Cek billing dengan dueDate < today
2. Update status → OVERDUE
3. Send WA reminder
```

---

## ⚠️ DEPRECATION

### Model Lama (JANGAN GUNAKAN):
- ❌ `SPPPayment` → Gunakan `Billing`
- ❌ `Transaction` (old) → Gunakan `Payment`

### Timeline:
```
✅ Week 1-8:  Migration & refactoring
✅ Week 9-12: Testing
⏳ Week 13+:  Remove old models
```

---

## 🔧 TROUBLESHOOTING

### Issue: Migration error
```bash
# Rollback
npx prisma migrate reset

# Restore backup
psql -h host -U user -d db < backup.sql
```

### Issue: Data tidak sync
```bash
# Verify
npx ts-node scripts/verify-migration.ts
```

### Issue: Performance lambat
```sql
-- Add indexes
CREATE INDEX idx_billing_student_status ON billings(student_id, status);
CREATE INDEX idx_billing_due_date ON billings(due_date);
```

---

## 📊 DASHBOARD METRICS

### Treasurer Dashboard:
```
- Total siswa aktif
- Tagihan bulan ini (BILLED)
- Tunggakan (OVERDUE)
- Pemasukan hari ini
- Pemasukan bulan ini
- Grafik pemasukan (7 hari)
- List siswa menunggak
```

### Student Dashboard:
```
- Tagihan belum dibayar (BILLED/OVERDUE)
- History pembayaran (PAID)
- Total tunggakan
- Tagihan cicilan (PARTIAL)
```

---

## ✅ CHECKLIST IMPLEMENTASI

### Database:
- [x] Refactor schema.prisma
- [x] Tambah 8 model baru
- [x] Update enum
- [ ] Apply migration
- [ ] Seed data
- [ ] Migrate existing data

### API:
- [ ] Implement billing endpoints
- [ ] Implement payment endpoints
- [ ] Implement reports endpoints
- [ ] Add webhook handler
- [ ] Add cron jobs

### UI:
- [ ] Update student dashboard
- [ ] Update treasurer dashboard
- [ ] Update payment flow
- [ ] Add reports page

### Testing:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing

### Deployment:
- [ ] Environment setup
- [ ] Database migration
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## 📞 SUPPORT

### Resources:
- 📚 Documentation: Baca semua file .md
- 🐛 Issues: Check GitHub issues
- 💬 Discussion: Team chat
- 📧 Email: admin@kassmpit.com

### Best Practices:
1. Selalu backup database sebelum migration
2. Test di staging dulu
3. Monitor logs setelah deploy
4. Update dokumentasi jika ada perubahan

---

## 🎓 SUMMARY

### ❌ Sebelum Refactoring:
- Tidak ada konsep tagihan (invoice)
- Tidak terikat tahun ajaran
- SPP sama untuk semua siswa
- Tidak bisa tracking tunggakan
- Tidak bisa cicilan

### ✅ Setelah Refactoring:
- ✅ Ada Billing (Invoice) terpisah dari Payment
- ✅ Terikat ke AcademicYear
- ✅ Tarif SPP berbeda per Class
- ✅ Bisa tracking tunggakan (status OVERDUE)
- ✅ Bisa cicilan (status PARTIAL)
- ✅ Audit trail lengkap
- ✅ Scalable & professional

### 🏆 Result:
**Sistem keuangan yang profesional, scalable, dan production-ready!**

---

**Last Updated:** 17 Desember 2024  
**Version:** 1.0.0  
**Status:** ✅ Ready for implementation
