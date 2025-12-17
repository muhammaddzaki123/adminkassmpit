# 🎓 Sistem Student-Centric - Dokumentasi Lengkap

**Tanggal:** 27 November 2025  
**Status:** ✅ Implementasi Selesai

---

## 📋 Ringkasan Sistem

Sistem telah diubah dari konsep **Parent-Centric** menjadi **Student-Centric**, di mana:
- **Siswa** yang memiliki akun dan melakukan pembayaran (bukan orang tua)
- **2 Tipe Siswa**: Siswa Baru (self-register) dan Siswa Lama (dibuatkan admin)
- **1 Siswa = 1 User Account** (one-to-one relation)
- **Riwayat pembayaran** tetap terhubung dengan akun siswa

---

## 🔄 Perubahan Database Schema

### **Perubahan Utama:**

```prisma
// ❌ SEBELUMNYA
enum UserRole {
  TREASURER
  ADMIN
  PARENT      // Tidak dipakai lagi
  HEADMASTER
}

model User {
  studentId String? @map("student_id")  // ❌ Tidak unique
  student   Student? @relation(fields: [studentId], references: [id])
}

model Student {
  users User[]  // ❌ One-to-many
}

// ✅ SEKARANG
enum UserRole {
  TREASURER
  ADMIN
  STUDENT     // ✅ Siswa yang login
  HEADMASTER
}

model User {
  studentId String? @unique @map("student_id")  // ✅ One-to-one
  student   Student? @relation(fields: [studentId], references: [id])
}

model Student {
  user User?  // ✅ One-to-one relation
}
```

### **Migration Command:**
```bash
npx prisma migrate dev --name add_student_role_and_unique_relation
npx prisma generate
```

---

## 🎯 Alur Sistem: 2 Tipe Siswa

### **Tipe 1: SISWA BARU (Self-Registration)**

```
┌─────────────────────────────────────────────────────────────┐
│  SISWA BARU - Pendaftaran Mandiri                          │
└─────────────────────────────────────────────────────────────┘

1. PENDAFTARAN
   ├─ URL: /register/student (public)
   ├─ Input: NISN, Nama, Kelas, Email, Password, No HP, Alamat, Nama Orang Tua
   └─ Submit → POST /api/public/register

2. SISTEM MEMBUAT
   ├─ Student record (status: PENDING_REGISTRATION, registrationPaid: false)
   ├─ User account (role: STUDENT, isActive: false)
   ├─ Virtual Account untuk pembayaran
   ├─ Transaction record (type: DAFTAR_ULANG, status: PENDING)
   └─ Return: VA number + nominal + expired

3. SISWA BAYAR
   ├─ Transfer ke VA
   ├─ Webhook diterima
   ├─ Update: Transaction.status = PAID
   ├─ Update: Student.registrationPaid = true
   └─ Status masih: PENDING_REGISTRATION (butuh approval)

4. ADMIN APPROVE
   ├─ Admin buka: /admin/registrations
   ├─ Filter: "Sudah Bayar"
   ├─ Klik: "Setujui"
   ├─ API: PUT /api/admin/registrations/{id}/approve
   ├─ Update: Student.status = ACTIVE
   └─ Update: User.isActive = true

5. SISWA LOGIN
   ├─ URL: /student/login
   ├─ Username: NISN
   ├─ Password: yang dibuat saat registrasi
   └─ Akses: /student/dashboard
```

**Status Student:**
- `PENDING_REGISTRATION` + `registrationPaid: false` → Belum bayar
- `PENDING_REGISTRATION` + `registrationPaid: true` → Menunggu approval
- `ACTIVE` → Siswa resmi, bisa login dan bayar SPP

---

### **Tipe 2: SISWA LAMA (Admin-Created)**

```
┌─────────────────────────────────────────────────────────────┐
│  SISWA LAMA - Import Massal oleh Admin                     │
└─────────────────────────────────────────────────────────────┘

1. ADMIN IMPORT
   ├─ URL: /admin/students/import
   ├─ Download template CSV
   ├─ Isi data: NISN, Nama, Kelas, Email, No HP, Alamat, Nama Orang Tua, Password
   └─ Upload file → POST /api/admin/students/import

2. SISTEM OTOMATIS
   ├─ Loop setiap baris Excel
   ├─ Create Student (status: ACTIVE, registrationPaid: true)
   ├─ Create User (role: STUDENT, isActive: true)
   ├─ Generate Virtual Account
   ├─ Hash password
   └─ Skip NISN yang sudah ada (tidak duplikat)

3. HASIL IMPORT
   ├─ Tampilkan: Berhasil X siswa, Gagal Y siswa
   ├─ List error: Baris Z - [Error message]
   └─ Siswa langsung bisa login

4. SISWA LOGIN
   ├─ URL: /student/login
   ├─ Username: NISN (dari Excel)
   ├─ Password: dari kolom Password Excel
   └─ Akses: /student/dashboard
```

**Status Student:**
- Langsung `ACTIVE` (tidak perlu approval)
- `registrationPaid: true` (anggap sudah bayar daftar ulang)
- `enrollmentType: CONTINUING` (siswa lanjutan)

---

## 📁 File yang Dibuat/Diubah

### **1. Database Schema**
- ✅ `prisma/schema.prisma`
  - Tambah `STUDENT` ke enum `UserRole`
  - Ubah `User.studentId` jadi `@unique`
  - Ubah `Student.users` jadi `Student.user` (singular)

### **2. Admin Pages**
- ✅ `/admin/registrations/page.tsx` → Review & approve pendaftaran siswa baru
- ✅ `/admin/students/import/page.tsx` → Import siswa massal via Excel

### **3. Public Pages**
- ✅ `/register/student/page.tsx` → Form pendaftaran siswa baru

### **4. API Endpoints**
- ✅ `/api/public/register/route.ts` → Registrasi siswa baru
- ✅ `/api/admin/registrations/route.ts` → Get list pendaftaran
- ✅ `/api/admin/registrations/[id]/approve/route.ts` → Approve pendaftaran
- ✅ `/api/admin/registrations/[id]/reject/route.ts` → Tolak pendaftaran
- ✅ `/api/admin/students/import/route.ts` → Import siswa massal

### **5. Student Portal (Sudah Ada)**
- ✅ `/student/dashboard/page.tsx`
- ✅ `/student/spp/page.tsx`
- ✅ `/student/history/page.tsx`
- ✅ `/student/profile/page.tsx`

---

## 🔐 User Roles & Permissions

| Role | Akses Menu | Deskripsi |
|------|------------|-----------|
| **ADMIN** | `/admin/*` | Kelola siswa, settings, approval |
| **TREASURER** | `/treasurer/*` | Kelola pembayaran, laporan |
| **STUDENT** | `/student/*` | Dashboard, bayar SPP, riwayat |
| **HEADMASTER** | `/headmaster/*` | View reports, analytics |

---

## 📊 Perbedaan Siswa Baru vs Siswa Lama

| Aspek | Siswa Baru | Siswa Lama |
|-------|-----------|-----------|
| **Cara Registrasi** | Self-register via web | Import massal oleh admin |
| **Status Awal** | `PENDING_REGISTRATION` | `ACTIVE` |
| **Pembayaran Daftar Ulang** | Wajib bayar dulu | Tidak perlu (skip) |
| **Approval Admin** | Wajib (setelah bayar) | Tidak perlu |
| **Password** | Siswa buat sendiri | Admin set via Excel |
| **Login Pertama Kali** | Setelah diapprove | Langsung setelah import |
| **Enrollment Type** | `NEW` | `CONTINUING` |
| **Riwayat Pembayaran** | Mulai dari 0 | Bisa import dari sistem lama |
| **Virtual Account** | Auto-generate | Auto-generate |
| **User.isActive** | `false` → `true` (after approve) | `true` (langsung aktif) |

---

## 🎨 Halaman Admin - Fitur Utama

### **1. /admin/registrations**
**Tujuan:** Review dan approve pendaftaran siswa baru

**Fitur:**
- ✅ Tab filter: Semua / Sudah Bayar / Belum Bayar / Disetujui
- ✅ Search: NISN, nama, email
- ✅ Statistik: Total, Sudah Bayar, Belum Bayar, Disetujui
- ✅ Detail modal: Lihat lengkap data pendaftar
- ✅ Action: Setujui / Tolak
- ✅ Status badge: Pending / Lunas / Disetujui / Ditolak

**API yang Dipanggil:**
- `GET /api/admin/registrations` → Get list
- `PUT /api/admin/registrations/{id}/approve` → Approve
- `PUT /api/admin/registrations/{id}/reject` → Reject

---

### **2. /admin/students/import**
**Tujuan:** Import siswa massal via Excel

**Fitur:**
- ✅ Download template CSV
- ✅ Upload file (CSV, XLSX, XLS)
- ✅ Validasi: NISN 10 digit, email unique, dll
- ✅ Hasil import: Berhasil / Gagal + detail error
- ✅ Auto-create User account
- ✅ Skip NISN yang sudah ada
- ✅ Panduan lengkap cara import

**Format Excel:**
```
NISN,Nama Lengkap,Kelas,Email,No Telepon,Alamat,Nama Orang Tua,Password
1234567890,Ahmad Zaki,7A,zaki@email.com,081234567890,Jl. Contoh No. 1,Budi Santoso,password123
```

**API yang Dipanggil:**
- `POST /api/admin/students/import` → Process Excel

---

## 🌐 Halaman Public - Registrasi

### **/register/student**
**Tujuan:** Pendaftaran siswa baru secara mandiri

**Fitur:**
- ✅ Form lengkap: NISN, Nama, Kelas, Email, Password, dll
- ✅ Validasi real-time
- ✅ Konfirmasi password
- ✅ Info biaya pendaftaran: Rp 500.000
- ✅ Setelah submit: Dapat VA number + nominal + expired
- ✅ Link ke halaman login

**Flow Setelah Submit:**
1. Sistem create Student + User (inactive)
2. Generate VA
3. Tampilkan halaman sukses dengan VA
4. Siswa transfer ke VA
5. Webhook update status
6. Admin approve
7. Siswa bisa login

---

## 📱 Student Portal - Menu Utama

### **1. /student/dashboard**
- Info siswa: NISN, Nama, Kelas
- Status SPP: Lunas / Tunggakan
- Total dibayar & tunggakan
- Virtual Account
- Pembayaran terakhir
- Quick actions: Bayar SPP, Riwayat, Profil

### **2. /student/spp**
- Pilih bulan pembayaran
- Nominal SPP
- Transfer via VA
- Upload bukti transfer (opsional)
- Auto-recorded dari webhook

### **3. /student/history**
- Riwayat semua pembayaran
- Filter: Bulan, Status
- Download laporan
- Cetak bukti pembayaran

### **4. /student/profile**
- Lihat data diri
- Update email, no HP
- Ganti password
- Virtual Account

---

## 🔧 API Endpoints - Dokumentasi

### **Public API**

#### `POST /api/public/register`
**Deskripsi:** Registrasi siswa baru

**Request Body:**
```json
{
  "nisn": "1234567890",
  "nama": "Ahmad Zaki",
  "kelas": "7A",
  "email": "zaki@email.com",
  "password": "password123",
  "confirmPassword": "password123",
  "noTelp": "081234567890",
  "alamat": "Jl. Contoh No. 1",
  "namaOrangTua": "Budi Santoso"
}
```

**Response Success (200):**
```json
{
  "message": "Pendaftaran berhasil! Silakan lakukan pembayaran.",
  "student": {
    "id": "uuid",
    "nisn": "1234567890",
    "nama": "Ahmad Zaki"
  },
  "payment": {
    "vaNumber": "8808123456",
    "amount": 500000,
    "expiredAt": "2025-11-28T10:00:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "message": "NISN sudah terdaftar"
}
```

---

### **Admin API**

#### `GET /api/admin/registrations`
**Deskripsi:** Get list pendaftaran siswa baru

**Response:**
```json
[
  {
    "id": "uuid",
    "nisn": "1234567890",
    "nama": "Ahmad Zaki",
    "kelas": "7A",
    "email": "zaki@email.com",
    "noTelp": "081234567890",
    "alamat": "Jl. Contoh",
    "namaOrangTua": "Budi Santoso",
    "registrationDate": "2025-11-27T10:00:00Z",
    "registrationFee": 500000,
    "registrationPaid": true,
    "status": "PENDING_REGISTRATION",
    "virtualAccount": "8808123456"
  }
]
```

---

#### `PUT /api/admin/registrations/{id}/approve`
**Deskripsi:** Approve pendaftaran siswa

**Response:**
```json
{
  "message": "Siswa berhasil disetujui",
  "student": {
    "id": "uuid",
    "status": "ACTIVE",
    "approvalStatus": "APPROVED",
    "approvedAt": "2025-11-27T12:00:00Z"
  }
}
```

---

#### `PUT /api/admin/registrations/{id}/reject`
**Deskripsi:** Tolak pendaftaran siswa

**Request Body:**
```json
{
  "reason": "Data tidak lengkap"
}
```

**Response:**
```json
{
  "message": "Pendaftaran ditolak",
  "reason": "Data tidak lengkap"
}
```

---

#### `POST /api/admin/students/import`
**Deskripsi:** Import siswa massal via Excel

**Request:** FormData dengan file CSV/Excel

**Response:**
```json
{
  "success": 45,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "nisn": "1234567890",
      "error": "NISN sudah terdaftar"
    },
    {
      "row": 12,
      "nisn": "9876543210",
      "error": "Email sudah digunakan"
    }
  ]
}
```

---

## ⚠️ Catatan Penting

### **Migration Database**
Database migration siap, tapi **belum dijalankan** karena database offline saat implementasi.

**Jalankan saat database online:**
```bash
npx prisma migrate dev --name add_student_role_and_unique_relation
npx prisma generate
```

### **Webhook Integration**
Sistem sudah siap untuk integrasi webhook payment gateway:
- Update `Transaction.status` dari PENDING → PAID
- Update `Student.registrationPaid` = true
- Trigger notification ke siswa

### **Riwayat Pembayaran Lama**
Jika ada data pembayaran sebelumnya, buat script migration:
```typescript
// migration/import-old-payments.ts
import { PrismaClient } from '@prisma/client';
import { readExcel } from './utils';

const prisma = new PrismaClient();

async function importOldPayments() {
  const oldPayments = await readExcel('pembayaran_lama.xlsx');
  
  for (const payment of oldPayments) {
    const student = await prisma.student.findUnique({
      where: { nisn: payment.nisn }
    });
    
    if (!student) continue;
    
    await prisma.sPPPayment.create({
      data: {
        studentId: student.id,
        bulan: payment.bulan,
        tahunAjaran: payment.tahunAjaran,
        nominal: payment.nominal,
        status: 'PAID',
        tanggalBayar: payment.tanggalBayar,
        metodePembayaran: 'TUNAI',
        autoRecorded: false,
      }
    });
  }
}

importOldPayments();
```

---

## ✅ Checklist Deployment

- [x] Update Prisma schema
- [x] Buat halaman `/admin/registrations`
- [x] Buat halaman `/admin/students/import`
- [x] Buat halaman `/register/student`
- [x] Buat API endpoints (5 endpoints)
- [x] Student portal sudah ada
- [ ] **Run migration** (saat database online)
- [ ] Test registrasi siswa baru
- [ ] Test import massal
- [ ] Test approval flow
- [ ] Test login siswa
- [ ] Integrasi webhook payment
- [ ] Setup email notification
- [ ] Import data pembayaran lama (jika ada)

---

## 📞 Support & Troubleshooting

### **Error: NISN sudah terdaftar**
**Solusi:** NISN harus unique, gunakan NISN berbeda

### **Error: Email sudah digunakan**
**Solusi:** Email harus unique per User, gunakan email berbeda

### **Siswa tidak bisa login setelah registrasi**
**Cek:**
1. Apakah sudah bayar? (`Student.registrationPaid = true`)
2. Apakah sudah diapprove? (`Student.status = ACTIVE`)
3. Apakah User aktif? (`User.isActive = true`)

### **Import gagal semua**
**Cek:**
1. Format Excel sesuai template?
2. NISN 10 digit?
3. Email valid dan unique?
4. Tidak ada baris kosong?

---

## 🎉 Fitur Tambahan (Future Enhancement)

1. **Email Notification**
   - Welcome email setelah registrasi
   - Notif pembayaran berhasil
   - Reminder SPP jatuh tempo

2. **WhatsApp Integration**
   - Kirim VA via WA
   - Notif pembayaran real-time
   - Reminder otomatis

3. **Multi-Child Support**
   - 1 email orang tua untuk beberapa anak
   - Dashboard orang tua lihat semua anak

4. **Reporting**
   - Export data siswa
   - Laporan pembayaran per kelas
   - Analytics dashboard

5. **Mobile App**
   - Notifikasi push
   - Scan QR untuk pembayaran
   - History pembayaran offline

---

**🚀 Sistem siap digunakan! Migration tinggal dijalankan saat database online.**
