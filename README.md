# 🎓 KASSMPIT Admin Dashboard

Sistem manajemen keuangan dan administrasi sekolah yang komprehensif dengan fitur billing profesional, payment gateway integration, dan WhatsApp bot automation.

## 📋 Daftar Isi

- [Tentang Project](#tentang-project)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Setup & Instalasi](#setup--instalasi)
- [Database Setup](#database-setup)
- [Menjalankan Development Server](#menjalankan-development-server)
- [Scripts & Commands](#scripts--commands)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Dokumentasi](#dokumentasi)

---

## Tentang Project

**KASSMPIT Admin** adalah dashboard admin komprehensif untuk manajemen keuangan sekolah dengan fitur:

- 🏦 **Sistem Billing Profesional** - Manajemen pembayaran siswa yang terstruktur
- 💳 **Payment Gateway Integration** - Integrasi dengan Midtrans untuk pembayaran online
- 📊 **Dashboard Analytics** - Laporan keuangan dan analitik real-time
- 👥 **Multi-Role Access Control** - Admin, Treasurer, Principal dengan permissions berbeda
- 📱 **WhatsApp Bot Integration** - Notifikasi dan pengingat pembayaran otomatis
- 🔐 **Secure Authentication** - NextAuth.js dengan email/password login
- 🎯 **Student & Payment Management** - CRUD lengkap untuk manajemen siswa dan pembayaran

---

## Tech Stack

### Frontend
- **Next.js 15.5.6** - React framework dengan server components
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend & Database
- **Prisma ORM** - Database ORM yang powerful
- **PostgreSQL** - Database utama
- **NextAuth.js** - Authentication & authorization

### Integrasi
- **Midtrans Payment Gateway** - Payment processing
- **WhatsApp Web.js** - WhatsApp bot automation
- **Nodemailer** - Email notifications
- **jsPDF** - PDF generation untuk laporan

### Development Tools
- **ESLint** - Code linting
- **Turbopack** - Fast build tool
- **Prisma CLI** - Database migration & management

---

## Prasyarat

Pastikan Anda sudah menginstall:
- **Node.js** v18+ (gunakan `node --version` untuk cek)
- **npm** atau **yarn** package manager
- **PostgreSQL** 12+ (atau Docker untuk PostgreSQL)
- **Git** untuk version control

---

## Setup & Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd adminkassmpit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root project:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kassmpit_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate dengan: openssl rand -base64 32

# Midtrans Payment Gateway
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_SERVER_KEY="your-midtrans-server-key"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WhatsApp Bot (Optional)
WHATSAPP_BOT_ENABLED="false"
```

### 4. Setup Database
Lihat bagian [Database Setup](#database-setup) di bawah.

---

## Database Setup

### Option 1: Menggunakan Docker (Recommended)
```bash
# Start PostgreSQL container
npm run docker:up

# Lihat logs
npm run docker:logs

# Stop container
npm run docker:down
```

### Option 2: PostgreSQL Local
Pastikan PostgreSQL sudah running, kemudian setup database:

```bash
# Push schema ke database
npm run db:setup

# Atau manual:
npm run prisma:push
npm run prisma:seed
```

### Option 3: Database Migration
Jika upgrading dari versi sebelumnya:

```bash
# Jalankan migration
npm run prisma:migrate

# Atau push changes
npm run prisma:push
```

### Viewing Database (Prisma Studio)
```bash
npm run prisma:studio
```
Buka [http://localhost:5555](http://localhost:5555) di browser untuk melihat dan manage data.

---

## Menjalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

Server akan auto-reload ketika Anda membuat perubahan pada file.

---

## Scripts & Commands

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Start development server dengan Turbopack |
| `npm run build` | Build untuk production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint untuk check code quality |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |
| `npm run docker:logs` | View PostgreSQL logs |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema ke database (tanpa migration file) |
| `npm run prisma:migrate` | Create & apply migration files |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run prisma:seed` | Seed database dengan data awal |
| `npm run db:setup` | Setup database lengkap (push + seed) |
| `npm run qa:reset-e2e` | Reset password untuk QA testing |

---

## Project Structure

```
adminkassmpit/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── auth/             # Authentication pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions & helpers
│   └── styles/               # Global styles
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Database seed script
│   └── migrations/           # Migration files
├── dokumentasi/              # Project documentation
├── public/                   # Static files
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Docker configuration
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

---

## Key Features

### 🔐 Authentication & Authorization
- NextAuth.js dengan email/password login
- Role-based access control (Admin, Treasurer, Principal, Student)
- Secure session management
- Password encryption dengan bcryptjs

### 💰 Billing System
- **Student Billing** - Manajemen tagihan siswa
- **Payment Management** - Tracking pembayaran online & offline
- **Installment Plans** - Rencana pembayaran cicilan
- **Discount Management** - Kelola diskon per siswa
- **Cash Ledger** - Pencatatan kas masuk/keluar

### 📊 Financial Reporting
- Dashboard dengan analytics real-time
- Laporan keuangan terperinci
- Payment status tracking
- Income & expense categories

### 💳 Payment Integration
- **Midtrans Integration** - Pembayaran online via Midtrans
- **Payment Audit** - Audit trail lengkap setiap transaksi
- **Transaction ID Tracking** - Tracking pembayaran end-to-end

### 📱 WhatsApp Automation (Optional)
- Notifikasi pembayaran via WhatsApp
- Pengingat pembayaran terjadwal
- WhatsApp bot automation

### 📄 Document Generation
- PDF invoice generation
- Report exports
- Student statement reports

---

## Dokumentasi

Dokumentasi lengkap project ada di folder `/dokumentasi`:

### 📚 Dokumentasi Utama
- **[DATABASE_REFACTORING_README.md](dokumentasi/DATABASE_REFACTORING_README.md)** - Overview sistem billing baru
- **[PROFESSIONAL_BILLING_SYSTEM.md](dokumentasi/PROFESSIONAL_BILLING_SYSTEM.md)** - Detail sistem pembayaran profesional
- **[MIGRATION_GUIDE.md](dokumentasi/MIGRATION_GUIDE.md)** - Panduan migrasi database
- **[API_IMPLEMENTATION_EXAMPLES.md](dokumentasi/API_IMPLEMENTATION_EXAMPLES.md)** - Contoh implementasi API
- **[MIDTRANS_SETUP.md](dokumentasi/MIDTRANS_SETUP.md)** - Setup payment gateway
- **[WHATSAPP_IMPLEMENTATION_STATUS.md](dokumentasi/WHATSAPP_IMPLEMENTATION_STATUS.md)** - WhatsApp bot setup
- **[QUICK_REFERENCE_BILLING.md](dokumentasi/QUICK_REFERENCE_BILLING.md)** - Quick reference development

### 🗺️ Database & Architecture
- **[ERD-KASSMPIT.drawio](docs/ERD-KASSMPIT.drawio)** - Entity Relationship Diagram
- **[ACTIVITY-DIAGRAM-KASSMPIT.drawio](docs/ACTIVITY-DIAGRAM-KASSMPIT.drawio)** - Activity diagrams
- **[FLOWMAP-KASSMPIT.drawio](docs/FLOWMAP-KASSMPIT.drawio)** - Process flowmaps

---

## Development Workflow

### 1. Membuat Feature Baru
```bash
# Create feature branch
git checkout -b feature/nama-feature

# Develop & test
npm run dev

# Commit changes
git add .
git commit -m "feat: deskripsi feature"
```

### 2. Database Changes
```bash
# Edit prisma/schema.prisma

# Create migration
npm run prisma:migrate

# Or push without migration file
npm run prisma:push
```

### 3. Testing
```bash
# Run linter
npm run lint

# QA Reset Password Test
npm run qa:reset-e2e
```

### 4. Build Production
```bash
# Build optimized
npm run build

# Test production build locally
npm start
```

---

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
npm run docker:logs

# Restart container
npm run docker:down
npm run docker:up

# Recreate schema
npm run prisma:push
```

### Prisma Client Error
```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Port 3000 Already in Use
```bash
# Kill process or use different port
npm run dev -- -p 3001
```

Untuk troubleshooting lebih lengkap, lihat [TROUBLESHOOTING_LOGIN.md](TROUBLESHOOTING_LOGIN.md)

---

## Kontribusi

1. Create feature branch: `git checkout -b feature/AmazingFeature`
2. Commit changes: `git commit -m 'Add some AmazingFeature'`
3. Push to branch: `git push origin feature/AmazingFeature`
4. Open Pull Request

---

## License

Private project - KASSMPIT School Management System

---

## Support & Contact

Untuk bantuan atau pertanyaan, hubungi tim development KASSMPIT.

---

**Last Updated**: April 2026 | **Version**: 0.1.0
