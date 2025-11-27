# 🎓 Alur Registrasi Siswa Baru - Student Role System

## 📋 Konsep Role System

Ada **2 Role untuk Siswa**:

1. **NEW_STUDENT** → Siswa baru yang belum diapprove
   - Sudah punya akun tapi **belum bisa login penuh**
   - Status: `PENDING_REGISTRATION`
   - `isActive: false`
   - Hanya bisa melihat status pendaftaran (future: dashboard terbatas)

2. **STUDENT** → Siswa resmi yang sudah diapprove
   - **Bisa login penuh** ke sistem
   - Status: `ACTIVE`
   - `isActive: true`
   - Akses penuh: Dashboard, Bayar SPP, Riwayat, dll

---

## 🔄 Alur Lengkap Siswa Baru

```
┌─────────────────────────────────────────────────────────────────┐
│  ALUR REGISTRASI SISWA BARU (NEW_STUDENT → STUDENT)            │
└─────────────────────────────────────────────────────────────────┘

STEP 1: PENDAFTARAN (Calon Siswa)
├─ Buka: /register/student
├─ Isi form: NISN, Nama, Email, Password, dll
├─ Submit → POST /api/public/register
│
SISTEM MEMBUAT:
├─ Student record
│  ├─ status: PENDING_REGISTRATION
│  ├─ registrationPaid: false
│  └─ Virtual Account: 8808XXXXXX
│
├─ User account
│  ├─ role: NEW_STUDENT ✅ (belum bisa login penuh)
│  ├─ isActive: false
│  ├─ username: NISN
│  └─ password: hashed
│
└─ Transaction record
   ├─ type: DAFTAR_ULANG
   ├─ status: PENDING
   └─ amount: Rp 500.000

STEP 2: PEMBAYARAN (Calon Siswa)
├─ Dapat VA number: 8808XXXXXX
├─ Transfer Rp 500.000 ke VA
│
WEBHOOK PAYMENT:
├─ Update Transaction.status → PAID
├─ Update Student.registrationPaid → true
└─ Status masih: PENDING_REGISTRATION
   (Masih butuh approval admin)

STEP 3: APPROVAL ADMIN
├─ Admin buka: /admin/registrations
├─ Filter: "Sudah Bayar"
├─ Lihat pendaftar dengan registrationPaid = true
├─ Klik: "Setujui"
│
API: PUT /api/admin/registrations/{id}/approve
│
SISTEM UPDATE:
├─ Student.status → ACTIVE
├─ Student.approvalStatus → APPROVED
├─ User.role → STUDENT ✅ (upgrade dari NEW_STUDENT)
└─ User.isActive → true ✅

STEP 4: SISWA LOGIN (Sekarang Jadi STUDENT)
├─ Buka: /student/login
├─ Username: NISN
├─ Password: yang dibuat saat registrasi
│
CEK LOGIN:
├─ User.role === 'STUDENT' ✅ (sudah upgrade)
├─ User.isActive === true ✅
└─ Redirect ke: /student/dashboard

STEP 5: PEMBAYARAN DAFTAR ULANG
├─ Siswa bayar daftar ulang via VA
├─ Webhook update status
└─ Siswa bisa mulai bayar SPP bulanan
```

---

## 🔐 Login System - Role Based Access

### **NEW_STUDENT (Belum Diapprove)**
```javascript
// Login attempt
if (user.role === 'NEW_STUDENT') {
  // ❌ Tidak bisa login penuh
  // ✅ Redirect ke: /registration/status
  // Tampilkan: "Pendaftaran Anda sedang diproses"
}
```

**Access:**
- ❌ Dashboard siswa
- ❌ Bayar SPP
- ❌ Riwayat pembayaran
- ✅ Cek status pendaftaran (terbatas)

---

### **STUDENT (Sudah Diapprove)**
```javascript
// Login attempt
if (user.role === 'STUDENT' && user.isActive === true) {
  // ✅ Login berhasil
  // ✅ Redirect ke: /student/dashboard
}
```

**Access:**
- ✅ Dashboard siswa
- ✅ Bayar SPP
- ✅ Riwayat pembayaran
- ✅ Update profil
- ✅ Semua fitur portal siswa

---

## 📊 Database Schema

```prisma
enum UserRole {
  TREASURER
  ADMIN
  NEW_STUDENT  // ✅ Siswa baru (belum diapprove)
  STUDENT      // ✅ Siswa resmi (sudah diapprove)
  HEADMASTER
}

model User {
  role      UserRole
  isActive  Boolean  @default(true)
  studentId String?  @unique
}

model Student {
  status            StudentStatus @default(PENDING_REGISTRATION)
  registrationPaid  Boolean       @default(false)
  approvalStatus    String?       @default("PENDING")
  user              User?
}
```

---

## 🎯 State Changes

### **Saat Registrasi:**
```
User.role = NEW_STUDENT
User.isActive = false
Student.status = PENDING_REGISTRATION
Student.registrationPaid = false
```

### **Setelah Bayar:**
```
User.role = NEW_STUDENT (masih sama)
User.isActive = false (masih sama)
Student.registrationPaid = true ✅ (updated)
Student.status = PENDING_REGISTRATION (masih sama)
```

### **Setelah Admin Approve:**
```
User.role = STUDENT ✅ (upgraded)
User.isActive = true ✅ (activated)
Student.status = ACTIVE ✅
Student.approvalStatus = APPROVED ✅
```

---

## 🆚 Perbedaan NEW_STUDENT vs STUDENT

| Aspek | NEW_STUDENT | STUDENT |
|-------|-------------|---------|
| **Status Pendaftaran** | PENDING_REGISTRATION | ACTIVE |
| **Bisa Login Penuh** | ❌ Tidak | ✅ Ya |
| **isActive** | false | true |
| **Akses Dashboard** | ❌ Terbatas | ✅ Penuh |
| **Bayar SPP** | ❌ Tidak bisa | ✅ Bisa |
| **Riwayat Pembayaran** | ❌ Tidak ada | ✅ Ada |
| **Upgrade Trigger** | Admin approve | - |

---

## 🔧 API Endpoints

### **POST /api/public/register**
**Create NEW_STUDENT account**

```javascript
// Creates:
User {
  role: 'NEW_STUDENT',  // ✅
  isActive: false
}

Student {
  status: 'PENDING_REGISTRATION',
  registrationPaid: false
}
```

---

### **PUT /api/admin/registrations/{id}/approve**
**Upgrade NEW_STUDENT → STUDENT**

```javascript
// Updates:
User {
  role: 'STUDENT',  // ✅ Upgraded
  isActive: true
}

Student {
  status: 'ACTIVE',
  approvalStatus: 'APPROVED'
}
```

---

## 🎨 UI Flow

### **1. Halaman Registrasi** (`/register/student`)
- Form lengkap
- Submit → Dapat VA
- Pesan: "Silakan bayar, lalu tunggu approval admin"

### **2. Dashboard NEW_STUDENT** (`/registration/status`)
**Untuk NEW_STUDENT yang belum diapprove**

```
┌──────────────────────────────────────┐
│  Status Pendaftaran Anda             │
├──────────────────────────────────────┤
│  ✓ Registrasi berhasil               │
│  ✓ Pembayaran Rp 500.000 - LUNAS     │
│  ⏳ Menunggu approval admin           │
│                                       │
│  Anda akan menerima notifikasi       │
│  setelah pendaftaran disetujui       │
└──────────────────────────────────────┘
```

### **3. Dashboard STUDENT** (`/student/dashboard`)
**Untuk STUDENT yang sudah diapprove**

```
┌──────────────────────────────────────┐
│  Selamat Datang, Ahmad Zaki!         │
├──────────────────────────────────────┤
│  NISN: 1234567890 | Kelas: 7A        │
│                                       │
│  📊 Status SPP: Ada Tunggakan        │
│  💰 Total Dibayar: Rp 2.000.000      │
│  ⚠️  Tunggakan: Rp 500.000            │
│                                       │
│  [Bayar SPP] [Riwayat] [Profil]      │
└──────────────────────────────────────┘
```

---

## ✅ Migration Command

```bash
npx prisma migrate dev --name add_new_student_role
npx prisma generate
```

---

## 🚀 Testing Flow

1. **Test Registrasi:**
   ```
   → Buka /register/student
   → Isi form
   → Submit
   → Cek: User.role = NEW_STUDENT, isActive = false
   ```

2. **Test Login Sebelum Approve:**
   ```
   → Login dengan NISN + password
   → Hasil: ❌ "Akun Anda belum diaktifkan"
   ```

3. **Test Approval:**
   ```
   → Admin buka /admin/registrations
   → Klik "Setujui"
   → Cek: User.role = STUDENT, isActive = true
   ```

4. **Test Login Setelah Approve:**
   ```
   → Login dengan NISN + password
   → Hasil: ✅ Redirect ke /student/dashboard
   ```

---

## 🎉 Summary

**Konsep Utama:**
- **NEW_STUDENT** = Akun created, tapi **belum bisa login penuh**
- **STUDENT** = Akun **sudah diapprove**, bisa login dan bayar SPP
- **Upgrade trigger** = Admin klik "Setujui" di halaman registrations

**Flow Singkat:**
```
Registrasi → Bayar → Admin Approve → Login Penuh
(NEW_STUDENT)                        (STUDENT)
```

Sistem ini memastikan **hanya siswa yang sudah diverifikasi admin** yang bisa mengakses portal siswa penuh! 🔒
