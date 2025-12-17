# 🚀 Panduan Menjalankan Project Admin Kas SMPIT

## ✅ Status Project
Project sudah siap dijalankan! Semua error telah diperbaiki.

## 📋 Yang Sudah Dikonfigurasi

### 1. Dependencies Terinstal
- ✅ Next.js 15.5.6 dengan Turbopack
- ✅ React 19
- ✅ TypeScript
- ✅ Prisma ORM dengan PostgreSQL
- ✅ Tailwind CSS v4
- ✅ Lucide React (icons)
- ✅ clsx & tailwind-merge (styling utilities)

### 2. Database
- ✅ Supabase PostgreSQL sudah terkonfigurasi
- ✅ Prisma Client sudah di-generate
- ✅ Schema database sudah sinkron

### 3. Environment Variables
- ✅ File `.env` sudah ada dengan konfigurasi Supabase
- ✅ File `.env.example` sudah dibuat untuk referensi

## 🎯 Cara Menjalankan

### Development Server
```bash
npm run dev
```
Akses di: http://localhost:3000

### Build untuk Production
```bash
npm run build
npm start
```

### Prisma Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema ke database
npm run prisma:push

# Buka Prisma Studio (GUI untuk database)
npm run prisma:studio

# Migrasi database
npm run prisma:migrate
```

## 📱 Fitur yang Tersedia

### 1. Dashboard (/)
- Statistik keuangan
- Total pemasukan & pengeluaran
- Siswa tunggakan
- Grafik aktivitas

### 2. Manajemen Siswa (/students)
- CRUD data siswa
- Filter berdasarkan kelas dan status
- Search siswa
- Import/export data

### 3. Pembayaran SPP (/spp)
- Pencatatan pembayaran SPP
- Upload bukti transfer
- Status pembayaran
- Filter dan search

### 4. Pengeluaran (/expenses)
- Pencatatan pengeluaran sekolah
- Kategorisasi pengeluaran
- Upload bukti transaksi
- Approval workflow

### 5. Re-registrasi (/re-registration)
- Daftar ulang siswa
- Status pendaftaran

### 6. Laporan (/reports)
- Laporan keuangan
- Export data

### 7. History (/history)
- Riwayat transaksi

### 8. WA Reminder (/wa-reminder)
- Reminder pembayaran via WhatsApp

### 9. Backup (/backup)
- Backup dan restore database

## 🔧 Troubleshooting

### Jika ada error "Cannot find module"
```bash
npm install
```

### Jika Prisma Client tidak ter-generate
```bash
npm run prisma:generate
```

### Jika database tidak sinkron
```bash
npm run prisma:push
```

### Clear cache Next.js
```bash
rm -rf .next
npm run dev
```

## 🌐 API Endpoints

- `GET/POST /api/students` - Manajemen data siswa
- `GET/POST /api/spp-payments` - Pembayaran SPP
- `GET/POST /api/expenses` - Pengeluaran

## 📊 Database Models

### User
- id, username, password, role, studentId
- Role: TREASURER, ADMIN, PARENT, HEADMASTER

### Student
- id, nama, nisn, kelas, status
- Status: ACTIVE, GRADUATED, ARCHIVED

### SPPPayment
- id, studentId, bulan, nominal, status, tanggalBayar
- Status: PAID, PENDING, UNPAID

### Expense
- id, date, category, description, amount, status
- Category: GAJI, ATK, UTILITAS, PEMELIHARAAN, OPERASIONAL, LAINNYA

## 🎨 Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Icons:** Lucide React
- **Build Tool:** Turbopack

## 📝 Notes

- Project menggunakan Next.js 15 dengan App Router
- Styling menggunakan Tailwind CSS v4 (latest)
- Database hosting di Supabase PostgreSQL
- Development server berjalan dengan Turbopack untuk build yang lebih cepat

## 🔐 Security

Pastikan untuk:
1. Tidak commit file `.env` ke repository
2. Gunakan environment variables untuk kredensial
3. Implement authentication sebelum production
4. Validasi input di API routes

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository.

---

✨ **Project sudah ready untuk development!** ✨
