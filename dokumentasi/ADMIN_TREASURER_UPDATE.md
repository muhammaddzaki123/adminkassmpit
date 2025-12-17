# Update Admin & Treasurer Pages - Panduan

## Perubahan Sistem

Sistem sekarang memiliki **2 entitas siswa terpisah**:
- **NewStudent** (Calon siswa) - Pendaftaran baru
- **Student** (Siswa resmi) - Sudah diterima di sekolah

## File yang Perlu Diupdate

### 1. Admin - Kelola User (`src/app/admin/users/page.tsx`)

**Perubahan**:
- Ganti role "PARENT" (Orang Tua) → "STUDENT" (Siswa)
- Tambah support untuk "NEW_STUDENT" role
- Ketika buat user STUDENT → otomatis buat Student di database

**Update di line 173-177** (roleMap):
```typescript
const roleMap = {
  ADMIN: { label: 'Admin', color: 'primary' as const },
  TREASURER: { label: 'Bendahara', color: 'success' as const },
  HEADMASTER: { label: 'Kepsek', color: 'accent' as const },
  STUDENT: { label: 'Siswa', color: 'default' as const },
  NEW_STUDENT: { label: 'Calon Siswa', color: 'warning' as const },
};
```

**Update di line 260-264** (Select options):
```typescript
options={[
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TREASURER', label: 'Bendahara' },
  { value: 'HEADMASTER', label: 'Kepala Sekolah' },
  { value: 'STUDENT', label: 'Siswa' },
  { value: 'NEW_STUDENT', label: 'Calon Siswa' },
]}
```

**Update di line 254-258** (Filter):
```typescript
options={[
  { value: 'all', label: 'Semua Role' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TREASURER', label: 'Bendahara' },
  { value: 'HEADMASTER', label: 'Kepala Sekolah' },
  { value: 'STUDENT', label: 'Siswa' },
  { value: 'NEW_STUDENT', label: 'Calon Siswa' },
]}
```

---

### 2. Admin - Halaman Baru: Kelola Calon Siswa

**Buat file baru**: `src/app/admin/new-students/page.tsx`

Fitur:
- List semua calon siswa (NEW_STUDENT)
- Filter: PENDING, APPROVED, REJECTED
- Approve → Buat Student baru
- Reject → Update status
- View detail lengkap

API yang digunakan:
- `GET /api/admin/new-students?status={status}`
- `POST /api/admin/new-students/{id}/approve`
- `DELETE /api/admin/new-students/{id}/approve`

---

### 3. Admin - Tambah Siswa Langsung

**Buat file baru**: `src/app/admin/students/create/page.tsx`

Fitur:
- Form tambah siswa langsung (tidak perlu approval)
- Otomatis buat Student + User dengan role STUDENT
- Generate username & password otomatis

API: `POST /api/admin/students/create`

---

### 4. Admin - Import Siswa Massal

**File sudah ada**: `src/app/admin/students/import/page.tsx`

**Perubahan**:
- Upload Excel/CSV dengan format:
  - NISN, Nama, Kelas, Email, No Telp, Alamat, Nama Orang Tua, Password
- Otomatis buat Student + User untuk setiap row
- Show result: success count, failed count, error details

**API sudah ada**: `POST /api/admin/students/import/route.ts` ✅

---

### 5. Treasurer - Update Dashboard

**File**: `src/app/treasurer/dashboard/page.tsx`

**Perubahan**:
- Hitung siswa dari tabel `students` (bukan `new_students`)
- Filter ACTIVE students untuk SPP
- Stats: Total siswa aktif, SPP unpaid, dll

---

### 6. Treasurer - Update Students Page

**File**: `src/app/treasurer/students/page.tsx`

**Perubahan**:
- List dari tabel `students` (siswa resmi)
- Tidak termasuk NEW_STUDENT
- Filter by kelas, status

---

## API Endpoints Summary

### Calon Siswa (NEW_STUDENT)
```
GET    /api/admin/new-students                    → List calon siswa
GET    /api/admin/new-students?status=PENDING     → Filter by status
POST   /api/admin/new-students/{id}/approve       → Terima → Buat Student baru ✅
DELETE /api/admin/new-students/{id}/approve       → Tolak ✅
```

### Siswa Resmi (STUDENT)
```
POST   /api/admin/students/create                 → Tambah siswa langsung
POST   /api/admin/students/import                 → Import Excel ✅
GET    /api/admin/students                        → List siswa
GET    /api/treasurer/students                    → List untuk bendahara
```

---

## Flow Lengkap

### A. Calon Siswa Daftar Sendiri
```
1. Daftar di /calon-siswa/register
2. Login di /calon-siswa/login
3. Upload dokumen & bayar
4. Admin approve di /admin/new-students
5. Otomatis jadi Student → dapat username/password baru
6. Login di /login sebagai STUDENT
```

### B. Admin Tambah Siswa Langsung
```
1. Admin ke /admin/students/create
2. Isi form lengkap
3. Submit → Student + User langsung dibuat
4. Siswa langsung bisa login
```

### C. Admin Import Massal
```
1. Admin ke /admin/students/import
2. Upload Excel dengan format template
3. System proses setiap baris
4. Semua Student + User dibuat
5. Show result summary
```

---

## Priority Files to Create/Update

### HIGH PRIORITY:
1. ✅ Update `/admin/users/page.tsx` - Ganti PARENT → STUDENT
2. 🔨 Create `/admin/students/create/page.tsx` - Tambah siswa langsung
3. ✅ API `/api/admin/students/create/route.ts` - Create student API

### MEDIUM PRIORITY:
4. 🔨 Update `/treasurer/students/page.tsx` - Filter students only
5. 🔨 Create `/admin/new-students/page.tsx` - Kelola calon siswa

### LOW PRIORITY:
6. Update sidebar navigation untuk link baru
7. Add import template download
8. Validation improvements

---

## Next Steps

1. Update admin/users/page.tsx (PARENT → STUDENT + NEW_STUDENT)
2. Create API /api/admin/students/create
3. Create page /admin/students/create
4. Update treasurer pages untuk filter Student only
5. Test complete flow

Apakah mau saya lanjutkan implementasi file-file ini?
