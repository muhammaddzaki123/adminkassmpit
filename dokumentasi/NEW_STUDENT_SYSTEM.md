# Sistem Dua Entitas Terpisah: NEW_STUDENT vs STUDENT

## Konsep Dasar

Sistem ini memiliki **2 entitas user yang benar-benar terpisah**:

### 1. NEW_STUDENT (Calon Siswa)
- **Tujuan**: Untuk pendaftaran siswa baru
- **Login**: `/calon-siswa/login` (halaman terpisah)
- **Dashboard**: `/calon-siswa/dashboard`
- **Database**: Tabel `new_students`
- **Fitur**:
  - Lihat status pendaftaran
  - Upload dokumen
  - Bayar biaya pendaftaran
  - Track approval admin

### 2. STUDENT (Siswa Resmi)
- **Tujuan**: Untuk siswa yang sudah terdaftar di sekolah
- **Login**: `/login` (halaman utama bersama admin/guru)
- **Dashboard**: `/dashboard` (siswa)
- **Database**: Tabel `students`
- **Fitur**:
  - Bayar SPP
  - Daftar ulang
  - Lihat jadwal/nilai
  - Akses portal siswa lengkap

---

## Alur Lengkap

### Tahap 1: Pendaftaran (NEW_STUDENT)

```
1. Calon siswa mengisi form di /calon-siswa/register
   ↓
2. Data tersimpan di tabel `new_students`
   ↓
3. User account dibuat dengan role NEW_STUDENT
   ↓
4. Calon siswa login di /calon-siswa/login
   ↓
5. Akses dashboard pendaftaran di /calon-siswa/dashboard
```

**Data yang dibuat**:
```typescript
NewStudent {
  id, nama, nisn, email, noTelp, alamat,
  kelasYangDituju, academicYear,
  enrollmentType: "NEW" atau "TRANSFER",
  registrationFee: 500000,
  registrationPaid: false,
  approvalStatus: "PENDING"
}

User {
  username: NISN,
  password: hashed,
  role: "NEW_STUDENT",
  newStudentId: newStudent.id,
  isActive: true
}
```

### Tahap 2: Proses di Portal Calon Siswa

Calon siswa melakukan:
1. **Upload dokumen**: Foto, akta kelahiran, KK, ijazah
2. **Bayar biaya pendaftaran**: Via VA atau transfer
3. **Menunggu approval**: Status "PENDING" → Dashboard show progress

### Tahap 3: Admin Approve ✅ (Kunci Utama)

**BUKAN mengubah role**, tetapi **membuat data baru**:

```
Admin klik "Terima Pendaftaran"
   ↓
API: POST /api/admin/new-students/{id}/approve
   ↓
TRANSACTION:
   1. Update NewStudent.approvalStatus = "APPROVED"
   2. CREATE Student baru (siswa resmi)
   3. CREATE User baru dengan role STUDENT
   4. Deactivate User lama (NEW_STUDENT)
```

**Data yang dibuat**:
```typescript
Student {
  id: NEW,
  nama: dari NewStudent,
  nisn: sama,
  kelas: ditentukan admin (misal "7A"),
  status: "ACTIVE",
  sppStatus: "UNPAID",
  daftarUlangStatus: "UNPAID"
}

User {
  username: "123456_student", // NISN + suffix
  password: NISN (default), // Harus diganti siswa
  role: "STUDENT",
  studentId: student.id,
  isActive: true
}

// User NEW_STUDENT lama → isActive: false (archived)
```

### Tahap 4: Siswa Resmi Login

```
1. Siswa dapat username/password baru dari admin
   username: "123456_student"
   password: "123456" (NISN, harus diganti)
   ↓
2. Login di /login (halaman utama, bukan /calon-siswa/login)
   ↓
3. Role: STUDENT → Redirect ke /dashboard
   ↓
4. Akses fitur siswa: SPP, daftar ulang, dll
```

---

## Perbedaan Kunci

| Aspek | NEW_STUDENT | STUDENT |
|-------|-------------|---------|
| **Database** | `new_students` | `students` |
| **Halaman Login** | `/calon-siswa/login` | `/login` |
| **Dashboard** | `/calon-siswa/dashboard` | `/dashboard` |
| **Username** | NISN | NISN_student |
| **Fitur** | Pendaftaran, upload dokumen | SPP, daftar ulang, portal siswa |
| **Status** | PENDING/APPROVED/REJECTED | ACTIVE/GRADUATED/ARCHIVED |
| **Relasi User** | `newStudentId` | `studentId` |

---

## API Endpoints

### Calon Siswa (NEW_STUDENT)
```
POST   /api/calon-siswa/register     → Daftar akun baru
POST   /api/calon-siswa/login        → Login calon siswa
GET    /api/calon-siswa/profile      → Get profil calon siswa
POST   /api/calon-siswa/logout       → Logout
POST   /api/calon-siswa/upload-docs  → Upload dokumen
```

### Admin (Kelola Calon Siswa)
```
GET    /api/admin/new-students                    → List semua calon siswa
GET    /api/admin/new-students?status=PENDING     → Filter by status
POST   /api/admin/new-students/{id}/approve       → Terima → Buat Student baru
DELETE /api/admin/new-students/{id}/approve       → Tolak pendaftaran
```

### Siswa Resmi (STUDENT)
```
POST   /api/login                    → Login siswa/admin/guru
GET    /api/students/{id}            → Get data siswa
POST   /api/spp-payments             → Bayar SPP
POST   /api/re-registration          → Daftar ulang
```

---

## Schema Prisma

```prisma
enum UserRole {
  TREASURER
  ADMIN
  NEW_STUDENT  // Calon siswa (pendaftaran)
  STUDENT      // Siswa resmi (sekolah)
  HEADMASTER
}

model User {
  id           String      @id @default(uuid())
  username     String      @unique
  password     String
  nama         String
  role         UserRole
  studentId    String?     @unique    // Untuk STUDENT role
  student      Student?    @relation(...)
  newStudentId String?     @unique    // Untuk NEW_STUDENT role
  newStudent   NewStudent? @relation(...)
  isActive     Boolean     @default(true)
}

model NewStudent {
  id               String   @id @default(uuid())
  nama             String
  nisn             String   @unique
  kelasYangDituju  String
  academicYear     String
  enrollmentType   String   // NEW, TRANSFER
  registrationFee  Float
  registrationPaid Boolean  @default(false)
  approvalStatus   String   @default("PENDING") // PENDING, APPROVED, REJECTED
  user             User?
  // ... dokumen, data ortu, dll
}

model Student {
  id                String   @id @default(uuid())
  nama              String
  nisn              String   @unique
  kelas             String
  status            StudentStatus @default(ACTIVE)
  sppStatus         PaymentStatus
  daftarUlangStatus PaymentStatus
  user              User?
  sppPayments       SPPPayment[]
  transactions      Transaction[]
}
```

---

## Flow Approval Admin

```typescript
// Admin approve calon siswa
POST /api/admin/new-students/{id}/approve
Body: {
  adminId: "uuid-admin",
  kelas: "7A",
  notes: "Diterima jalur reguler"
}

// Response
{
  success: true,
  message: "Calon siswa berhasil diterima",
  data: {
    student: { id, nama, nisn, kelas },
    credentials: {
      username: "123456_student",
      password: "123456",
      note: "Password default adalah NISN. Harap diubah."
    }
  }
}
```

Admin harus memberikan `username` dan `password` ini ke siswa.

---

## Keuntungan Sistem Terpisah

✅ **Pemisahan Concern**: Pendaftaran vs Portal Siswa  
✅ **Keamanan**: Credential berbeda untuk 2 fase  
✅ **Audit Trail**: Data pendaftaran tersimpan permanent  
✅ **Fleksibilitas**: Bisa tolak/terima tanpa affect data siswa  
✅ **Skalabilitas**: Sistem pendaftaran bisa di-scale terpisah  

---

## Catatan Penting

⚠️ **NEW_STUDENT dan STUDENT tidak ada hubungan langsung**  
⚠️ **Approval bukan "upgrade role", tapi "create new entity"**  
⚠️ **User NEW_STUDENT di-deactivate (bukan dihapus) setelah approval**  
⚠️ **Siswa dapat 2 akun berbeda: 1 untuk daftar, 1 untuk sekolah**  
⚠️ **NISN harus unik di both NewStudent dan Student**  

---

## Testing Flow

### 1. Test Pendaftaran
```bash
POST /api/calon-siswa/register
{
  "nama": "Budi Santoso",
  "nisn": "1234567890",
  "kelasYangDituju": "7",
  "enrollmentType": "NEW",
  "password": "password123",
  ...
}
```

### 2. Login Calon Siswa
```bash
POST /api/calon-siswa/login
{
  "nisn": "1234567890",
  "password": "password123"
}
```

### 3. Admin Approve
```bash
POST /api/admin/new-students/{id}/approve
{
  "adminId": "admin-uuid",
  "kelas": "7A"
}
```

### 4. Login Siswa Resmi
```bash
POST /api/login
{
  "username": "1234567890_student",
  "password": "1234567890"
}
```

---

## Migration Command

Jalankan migration untuk create tables:

```bash
npx prisma migrate dev --name add_new_student_system
```

Generate Prisma client:

```bash
npx prisma generate
```

---

## Next Steps

1. ✅ Schema updated
2. ✅ APIs created
3. ✅ Login pages separated
4. ✅ Dashboards separated
5. ⏳ Admin UI untuk approve/reject
6. ⏳ Upload dokumen feature
7. ⏳ Payment integration
8. ⏳ Middleware untuk protect routes by role

---

**Sistem sekarang benar-benar terpisah antara NEW_STUDENT dan STUDENT!** 🎉
