# Analisis ERD: Kualitas dan Kepatuhan Standar

Dokumen ini berisi analisis mendalam mengenai `database_erd_final.drawio` yang telah dihasilkan, ditinjau dari aspek kelengkapan, logika database, dan standar profesional menggunakan Bahasa Indonesia.

## 1. Pemenuhan Syarat Utama (Compliance) ✅

ERD ini telah **MEMENUHI** standar ERD Fisikal (Physical Data Model) modern dengan perbaikan signifikan dari versi sebelumnya:

*   **Notasi Crow's Foot**: Penggunaan simbol `|<`, `||`, `o|` sudah tepat untuk menggambarkan kardinalitas (*One-to-Many*, *One-to-One*). Ini jauh lebih teknis dan akurat dibanding sekadar garis hubung biasa.
*   **Kelengkapan Entitas**: Seluruh **17 Tabel** dari Prisma Schema telah dimuat, termasuk tabel pendukung vital seperti `ActivityLog`, `NotificationLog`, dan `SystemSettings` yang sering terlewat dalam dokumentasi standar.
*   **Struktur Tabel Profesional**: Penggunaan format 3-Kolom (Tipe Data | Nama Kolom | Key) memudahkan developer dan DBA membaca struktur tanpa perlu membuka kode sumber.

## 2. Analisis Logika Relasi (Structural Logic)

### a. Centralized Billing Hub (Sangat Baik)
ERD berhasil menggambarkan `Billing` sebagai jantung sistem keuangan. Relasi ke `Student`, `AcademicYear`, `BillingTemplate`, `Payment`, dan `Installment` terlihat jelas terpusat. Ini merepresentasikan sistem "Invoice-Based" yang profesional, bukan sekadar pencatatan kas sederhana.

### b. Associative Entity pada `StudentClass` (Sangat Baik)
Relasi *Many-to-Many* antara `Student` dan `Class` telah dipecah dengan benar menggunakan `StudentClass`.
*   *Logika*: `Student` 1 ────< `StudentClass` >──── 1 `Class`.
*   Ini memungkinkan *history* pencatatan: siswa bisa naik kelas setiap tahun ajaran tanpa menimpa data kelas sebelumnya, yang merupakan syarat mutlak sistem akademik.

### c. Relasi User & Roles
Relasi `User` ke `Student` dan `NewStudent` digambarkan sebagai **1:0..1 (Optional One-to-One)**.
*   Artinya: Satu User *mungkin* adalah Student, tapi tidak wajib (bisa saja Admin atau Treasurer).
*   Ini sesuai dengan logika bisnis bahwa akun User adalah "Parent Identity" yang membawahi role spesifik.

## 3. Identifikasi Kejanggalan / Gap pada Schema (Critical Review) ⚠️

Meskipun ERD sudah menggambarkan Schema apa adanya dengan benar, terdapat beberapa **kejanggalan pada desain database asli (Prisma Schema)** yang terlihat jelas melalui visualisasi ERD ini:

### a. Tabel `Expense` Terisolasi (Orphan Table)
*   **Temuan**: Tabel `Expense` (Pengeluaran) berdiri sendiri secara visual tanpa relasi garis ke `User`.
*   **Analisis**: Dalam sistem akuntansi yang aman (audit-ready), setiap pengeluaran **WAJIB** memiliki relasi ke `User` (siapa yang membuat input atau menyetujui pengeluaran tersebut?). Saat ini, schema `Expense` tidak memiliki foreign key `createdById` atau `approvedById`.
*   **Status**: Kejanggalan Schema (bukan kesalahan ERD).

### b. Pemisahan Transaksi Pendaftaran (`NewStudentTransaction`)
*   **Temuan**: Pembayaran pendaftaran (`NewStudentTransaction`) terpisah total dari sistem `Billing` & `Payment` utama.
*   **Analisis**: Ini membuat laporan keuangan terpecah dua jalur (Pendapatan Pendaftaran vs Pendapatan SPP/Lainnya). Secara sistem ERP yang matang, biasanya pendaftaran akan men-generate sebuah `Billing` pertama agar semua arus kas masuk melalui satu pintu (`Payment`).
*   **Status**: Desain Schema yang kurang terintegrasi.

### c. Dependensi User ke Student
*   **Temuan**: Relasi `User` ke `Student` menggunakan `studentId` di tabel User.
*   **Analisis**: Ini sah secara teknis. Namun, secara visual ERD memperlihatkan `User` bergantung pada `Student`. Dalam beberapa praktik, relasi ini bisa dibalik (`Student` punya `userId`) agar User tabel tetap bersih/ringan, namun pendekatan saat ini (User memegang pointer) memudahkan query "Get User with Profile".
*   **Status**: Valid (Pilihan Arsitektur).

## Kesimpulan

Secara **Visual dan Standar ERD**, diagram ini sudah **SANGAT BAIK (9/10)** dan siap digunakan untuk dokumentasi teknis, sidang skripsi, atau panduan development tim.

Kekurangan yang tersisa (poin 3) bukanlah kesalahan gambar ERD, melainkan **peluang optimasi pada struktur database (Schema)** itu sendiri yang menjadi terlihat jelas berkat adanya ERD yang mendetail ini.
