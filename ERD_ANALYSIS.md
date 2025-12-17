# Analisis ERD: Struktur User Berbasis Peran (Logical View)

Dokumen ini menjelaskan struktur ERD terbaru (`database_erd_roles.drawio`) yang dirancang untuk menjawab kebutuhan representasi entitas pengguna yang lebih spesifik.

## 1. Perubahan Paradigma: Logical vs Physical

Dalam database fisik (`schema.prisma`), kita menggunakan strategi **Single Table Inheritance**:
*   Hanya ada satu tabel `User`.
*   Peran (`Admin`, `Treasurer`, `Headmaster`) dibedakan hanya melalui kolom `role`.

Namun, dalam ERD Logikal ini, kami memecah `User` menjadi entitas-entitas spesifik:
*   **User (Base)**: Menyimpan data autentikasi (username, password, email).
*   **Admin**: Entitas logikal untuk pengguna operasional.
*   **Treasurer (Bendahara)**: Entitas logikal untuk pengelola keuangan.
*   **Headmaster (Kepala Sekolah)**: Entitas logikal untuk persetujuan tingkat tinggi.

## 2. Struktur Hierarki (Inheritance)
ERD ini menggunakan notasi visual *Inheritance* (garis putus-putus dengan panah blok) untuk menunjukkan:
*   `Admin` **ADALAH** `User`.
*   `Treasurer` **ADALAH** `User`.
*   `Student` **MEMILIKI** akun `User` (1:1 Relasi Fisik).

## 3. Distribusi Tanggung Jawab (Separation of Concerns)

Dengan memecah entitas user, relasi menjadi jauh lebih jelas dan tidak ambigu:

| Modul | Aktor (Entitas) | Relasi / Aksi | Kejelasan |
| :--- | :--- | :--- | :--- |
| **Keuangan** | **Treasurer** | Menerbitkan `Billing`, Memproses `Payment`, Mengelola `Expense` | Kita tahu pasti siapa yang bertanggung jawab atas uang, bukan sekadar "User". |
| **Sistem** | **Admin** | Mengelola `SystemSettings`, Verifikasi `NewStudent` | Memisahkan tugas teknis dari tugas keuangan. |
| **Akademik** | **Headmaster** | Menyetujui `NewStudent` (Approval) | Menunjukkan hierarki persetujuan. |
| **Siswa** | **Student** | Menerima `Billing`, Masuk ke `StudentClass` | Jelas sebagai objek layanan pendidikan. |

## 4. Kesimpulan Kualitas

ERD versi ini (`roles`) adalah representasi yang lebih **kaya secara semantik** dibandingkan ERD fisik murni.
*   **Kelebihan**: Sangat mudah dipahami oleh stakeholder non-teknis (Kepala Sekolah, Bagian Keuangan) karena mereka melihat "Diri Mereka" sebagai kotak entitas sendiri.
*   **Catatan Implementasi**: Developer harus ingat bahwa `Admin`, `Treasurer`, dan `Headmaster` di database fisik tetap berada di tabel `User`.

Diagram ini memenuhi permintaan untuk menunjukkan bahwa *"setiap user seharusnya memiliki entitas sendiri"* secara konseptual.
