# 🎓 Quick Reference - Sistem Student-Centric

## 📋 Ringkasan Singkat

**Konsep Baru:** Siswa yang login dan bayar (bukan orang tua)  
**2 Tipe Siswa:**
1. **Siswa Baru** → Self-register → Bayar → Admin approve → Login
2. **Siswa Lama** → Admin import Excel → Langsung login

---

## 🗂️ Halaman yang Dibuat

### Admin Pages
- `/admin/registrations` → Review & approve siswa baru
- `/admin/students/import` → Import siswa massal

### Public Pages
- `/register/student` → Form registrasi siswa baru

### Student Portal (Existing)
- `/student/dashboard` → Dashboard siswa
- `/student/spp` → Bayar SPP
- `/student/history` → Riwayat pembayaran
- `/student/profile` → Profil & ganti password

---

## 🔌 API Endpoints

```
POST   /api/public/register                      → Registrasi siswa baru
GET    /api/admin/registrations                  → List pendaftaran
PUT    /api/admin/registrations/{id}/approve     → Approve siswa
PUT    /api/admin/registrations/{id}/reject      → Tolak siswa
POST   /api/admin/students/import                → Import Excel
```

---

## 🔄 Alur Siswa Baru

```
Registrasi (/register/student)
    ↓
Dapat VA untuk bayar Rp 500.000
    ↓
Siswa transfer ke VA
    ↓
Webhook update status (paid)
    ↓
Admin approve (/admin/registrations)
    ↓
Siswa login dengan NISN + Password
    ↓
Akses /student/dashboard
```

---

## 📊 Alur Siswa Lama

```
Admin buka /admin/students/import
    ↓
Download template Excel
    ↓
Isi data siswa (NISN, Nama, Email, Password, dll)
    ↓
Upload file
    ↓
Sistem auto-create Student + User
    ↓
Siswa langsung bisa login dengan NISN + Password dari Excel
    ↓
Akses /student/dashboard
```

---

## 🗄️ Database Changes

### Prisma Schema
```prisma
// Tambah role STUDENT
enum UserRole {
  STUDENT  // ✅ NEW
}

// One-to-one User ↔ Student
model User {
  studentId String? @unique  // ✅ Tambah @unique
}

model Student {
  user User?  // ✅ Singular (bukan users)
}
```

### Migration Command
```bash
npx prisma migrate dev --name add_student_role_and_unique_relation
npx prisma generate
```

⚠️ **Migration belum dijalankan** (database offline saat implementasi)

---

## 🎯 Perbedaan Utama

| Aspek | Siswa Baru | Siswa Lama |
|-------|-----------|-----------|
| Registrasi | Web form | Import Excel |
| Status Awal | PENDING_REGISTRATION | ACTIVE |
| Bayar Daftar Ulang | Ya (Rp 500.000) | Tidak |
| Approval Admin | Ya | Tidak |
| Password | Buat sendiri | Dari Excel |

---

## ✅ Next Steps

1. **Jalankan migration** saat database online
2. **Test registrasi** siswa baru
3. **Test import** siswa lama
4. **Setup webhook** payment gateway
5. **Import** data pembayaran lama (jika ada)

---

## 📖 Dokumentasi Lengkap

Lihat: `STUDENT_SYSTEM_DOCUMENTATION.md`
