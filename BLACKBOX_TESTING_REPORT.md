# 📦 Laporan Pengujian Blackbox (Blackbox Testing Report)

**Nama Sistem:** KASSMPIT Admin Dashboard
**Tanggal Pengujian:** Desember 2024
**Metode:** Automated API Testing (Node.js Script Simulation)

---

## 📊 1. Ringkasan Pengujian (Executive Summary)

Pengujian blackbox dilakukan terhadap antarmuka API (_Application Programming Interface_) untuk memverifikasi fungsionalitas inti yang meliputi:
1.  **Authentication (Autentikasi):** Kemampuan sistem untuk mengenali pengguna berdasarkan kredensial yang valid serta menolak format yang salah.
2.  **Role-Based Access Control (RBAC):** Kemampuan sistem membatasi akses endpoint sesuai dengan otorisasi peran (Admin, Treasurer).
3.  **Data Retrieval (Pengambilan Data):** Kemampuan antarmuka membaca dan memberikan data dari database berdasarkan permintaan HTTP.

**Total Test Cases:** 12
**Passed (Berhasil):** 12 (100%)
**Failed (Gagal):** 0 (0%)

Secara keseluruhan, sistem telah bekerja **sangat stabil** sesuai spesifikasi dan tidak menunjukkan adanya anomali pada jalur utama.

---

## 🛠️ 2. Rincian Skenario & Hasil Uji

### 🔐 Skenario A: Autentikasi (Authentication Logic)
Modul autentikasi dievaluasi untuk memastikan bahwa manajemen sesi bekerja sesuai standar JWT.

| ID | Nama Pengujian | Ekspektasi Output | Hasil | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC 1.1** | Valid Login Superadmin | Status `200 OK`, Mengembalikan JWT Token. | `200 OK` + Token | ✅ **PASS** |
| **TC 1.2** | Valid Login Treasurer | Status `200 OK`, Mengembalikan JWT Token. | `200 OK` + Token | ✅ **PASS** |
| **TC 1.3** | Invalid Login (Wrong Password) | Status `401 Unauthorized`. | `401 Unauthorized` | ✅ **PASS** |
| **TC 1.4** | Invalid Login (Missing Fields) | Status `400 Bad Request`. | `400 Bad Request` | ✅ **PASS** |

### 🛡️ Skenario B: Kontrol Akses Berbasis Peran (RBAC)
Endpoint sensitif harus menolak permintaan dari pengguna yang perannya (role) tidak mencukupi, termasuk pengguna anonim.

| ID | Nama Pengujian | Ekspektasi Output | Hasil | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC 2.1** | Admin mengakses `/api/admin/users` | Akses diberikan (Status `200 OK`). | `200 OK` | ✅ **PASS** |
| **TC 2.2** | Treasurer mengakses `/api/admin/users` | Akses ditolak karena role kurang, Status `403 Forbidden`. | `403 Forbidden` | ✅ **PASS** |
| **TC 2.3** | Unauthenticated mengakses `/api/admin/users` | Akses ditolak karena tidak ada token, Status `401 Unauthorized`. | `401 Unauthorized` | ✅ **PASS** |
| **TC 2.4** | Admin mengakses `/api/billing/list` | Akses diberikan (Status `200 OK`). | `200 OK` | ✅ **PASS** |
| **TC 2.5** | Treasurer mengakses `/api/billing/list` | Akses diberikan (Status `200 OK`). | `200 OK` | ✅ **PASS** |
| **TC 2.6** | Admin mengakses `/api/expenses` | Akses ditolak, eksklusif untuk Treasurer, Status `403 Forbidden`. | `403 Forbidden` | ✅ **PASS** |

### 📄 Skenario C: Pengambilan Data (Data Retrieval & Filter)
Sistem harus mampu memparsing parameter pencarian dan merespons dengan JSON yang terstruktur.

| ID | Nama Pengujian | Ekspektasi Output | Hasil | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC 3.1** | Ambil `/api/admin/settings` | Status `200 OK` dengan key `success: true`. | `200 OK` | ✅ **PASS** |
| **TC 3.2** | Ambil `/api/billing/list?status=PAID` | Status `200 OK`, response JSON memiliki objek `pagination`. | `200 OK` | ✅ **PASS** |

---

## 🎯 3. Kesimpulan

Hasil blackbox testing menunjukkan tingkat keandalan **100%** pada fitur inti sistem kontrol akses.
- Perlindungan otorisasi _middleware_ pada Next.js API berfungsi **sempurna** sehingga potensi kebocoran akses administrator terhadap akun yang lebih rendah levelnya (misal: Bendahara mengubah daftar user) tidak ditemukan.
- Mekanisme Autentikasi bekerja dengan semestinya.
- Struktur respon REST API (khususnya untuk pagination pada _billing_ dan settings) telah konsisten mengembalikan data JSON.

Sistem dinyatakan telah **lulus pengujian fungsional dasar**.
