# 🏫 T-SMART - Treasury Smart System

**Sistem Manajemen Keuangan Sekolah Digital** yang modern, efisien, dan real-time.

![T-SMART](https://img.shields.io/badge/T--SMART-Treasury%20System-7EC242?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.18.0-2D3748?style=for-the-badge&logo=prisma)

---

## 🎯 Tagline

**"Digitalisasi Keuangan Sekolah — Cepat, Akurat, dan Real-Time"**

---

## 🌟 Fitur Utama

### 💰 Manajemen Keuangan
- ✅ Dashboard real-time dengan statistik keuangan
- ✅ Pencatatan pemasukan & pengeluaran
- ✅ Laporan keuangan otomatis (BKU, SPP, Triwulan, Semester, Tahunan)
- ✅ Export ke PDF, Excel, dan Print

### 👥 Manajemen Siswa
- ✅ CRUD data siswa lengkap
- ✅ Import/Export data siswa via Excel
- ✅ Filter berdasarkan kelas dan status
- ✅ Arsip siswa lulus

### 💳 Pembayaran SPP
- ✅ Pencatatan pembayaran per bulan
- ✅ Upload bukti transfer
- ✅ Status pembayaran (PAID, PENDING, UNPAID)
- ✅ E-Kartu SPP digital

### 📊 Pengeluaran Sekolah
- ✅ Kategorisasi pengeluaran (Gaji, ATK, Utilitas, dll)
- ✅ Upload nota/bukti transaksi
- ✅ Approval workflow
- ✅ Auto kalkulasi saldo

### 📱 WhatsApp Reminder
- ✅ Template editor untuk pesan reminder
- ✅ Preview message bubble
- ✅ Automation toggle
- ✅ Pengingat otomatis untuk tunggakan

### 👤 Multi-Role Access
- **Bendahara** - Full access untuk manajemen keuangan
- **Kepala Sekolah** - Analytics & laporan strategis
- **Admin** - Kelola sistem & data
- **Orang Tua** - Bayar SPP & lihat riwayat

---

## 🎨 Design System

### Color Palette
- **Primary Green**: `#7EC242` - Warna utama T-SMART
- **Accent Orange**: `#F29A2E` - Highlight & CTAs
- **Deep Green**: `#4C7924` - UI elements

### Design Characteristics
- ✨ Modern & clean interface
- 🕌 Islamic-friendly theme
- 🔵 Rounded UI components
- 💫 Light neumorphism shadows

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.6 (App Router + Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **ORM**: Prisma 6.18.0
- **Database**: PostgreSQL (Supabase)

---

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd adminkassmpit

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan database credentials

# Push schema & generate client
npm run prisma:push
npm run prisma:generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio GUI |

---

## 📂 Project Structure

```
adminkassmpit/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx     # Dashboard
│   │   ├── login/       # Login & role selection
│   │   ├── students/    # Student management
│   │   ├── spp/        # SPP payments
│   │   ├── expenses/   # Expenses
│   │   └── api/        # API Routes
│   ├── components/
│   │   ├── ui/         # Reusable components
│   │   ├── layout/     # Layout components
│   │   └── features/   # Feature components
│   └── lib/
│       └── prisma.ts   # Prisma client
├── prisma/
│   └── schema.prisma   # Database schema
├── tailwind.config.ts  # Tailwind config
├── DESIGN_SYSTEM.md    # Design docs
└── T-SMART_IMPLEMENTATION.md  # Implementation docs
```

---

## 📚 Documentation

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Complete design guide
- **[SETUP.md](./SETUP.md)** - Setup instructions  
- **[T-SMART_IMPLEMENTATION.md](./T-SMART_IMPLEMENTATION.md)** - Implementation summary

---

## 🚀 Deployment

Recommended: **Vercel**

```bash
npm i -g vercel
vercel
```

---

## 📄 License

MIT License

---

**Developed with ❤️ for SMPIT**  
**Powered by Next.js 15 + TypeScript + Tailwind CSS v4 + Prisma**

🚀 **Production Ready!**
