# 📋 PANDUAN SETUP GOOGLE FORM UAT

**Aplikasi:** KASSMPIT Admin Dashboard  
**Tujuan:** User Acceptance Testing (UAT)  
**Target:** 50-100 responden dari setiap role

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Buat Google Form Baru

1. Buka https://forms.google.com
2. Klik "Blank form" (form kosong)
3. Di pojok kanan atas, klik ikon ⚙️ (Settings)

### Step 2: Konfigurasi Pengaturan Dasar

**General Tab:**
- [ ] **Title:** "User Acceptance Testing (UAT) - KASSMPIT Admin Dashboard"
- [ ] **Description:** 
```
Kami dengan senang hati mengundang Anda untuk berpartisipasi dalam User 
Acceptance Testing sistem KASSMPIT Admin Dashboard kami.

Feedback Anda sangat penting untuk memastikan sistem ini memenuhi kebutuhan Anda.

Waktu pengisian: ~10-15 menit
Semua data adalah confidential dan hanya akan digunakan untuk improvement sistem.

Terima kasih atas partisipasi Anda!
```

**Presentation Tab:**
- [ ] **Theme:** Pilih warna yang sesuai brand sekolah
- [ ] **Add Logo:** Upload logo sekolah
- [ ] **Custom Header Image:** Upload banner (opsional)

**Responses Tab:**
- [ ] **Collect Email Addresses:** CHECKED (untuk tracking)
- [ ] **Limit to 1 response:** CHECKED (1 responden = 1 form)
- [ ] **Edit after submit:** UNCHECKED (untuk data integrity)

---

### Step 3: Tambahkan Header Section

**Section 1: Introduction**

Tambahkan text block:
```
🎓 KASSMPIT Admin Dashboard
User Acceptance Testing (UAT)

Periode: Mei 2026
Durasi: ~10-15 menit

Instruksi:
1. Jawab semua pertanyaan dengan jujur berdasarkan pengalaman Anda
2. Gunakan skala 1-5 untuk rating (1=Sangat Tidak Setuju, 5=Sangat Setuju)
3. Silakan tambahkan komentar/saran di bagian akhir
4. Data Anda akan dijaga kerahasiaannya

Mari mulai! 👇
```

---

### Step 4: Input Pertanyaan

#### SECTION 1: IDENTITAS RESPONDEN

**Q1: Role/Posisi Anda**
- Type: Multiple Choice
- Options: 
  - Admin Sistem
  - Bendahara/Treasurer
  - Siswa/Wali Murid
  - Kepala Sekolah/Headmaster
  - Calon Siswa
- Required: YES

**Q2: Lama Penggunaan**
- Type: Multiple Choice
- Options:
  - Hari pertama (baru pertama kali)
  - 1-3 hari
  - 1-2 minggu
  - Lebih dari 2 minggu
- Required: YES

**Q3: Frekuensi Penggunaan**
- Type: Multiple Choice
- Options:
  - Setiap hari
  - 2-3 kali seminggu
  - Sekali seminggu
  - Jarang (sesekali saja)
- Required: YES

**Q4: Perangkat yang Digunakan**
- Type: Checkbox
- Options:
  - Desktop/Laptop
  - Tablet
  - Smartphone
- Required: YES

---

#### SECTION 2: KEMUDAHAN PENGGUNAAN

**Q5-Q10: Rating Scale (Linear 1-5)**

Untuk setiap pertanyaan:
```
Format:
[Pertanyaan]

Scale: 1 (Sangat Tidak Setuju) - 5 (Sangat Setuju)
```

Pertanyaan:
- Q5: Proses login mudah dan jelas
- Q6: Mudah menemukan fitur di menu
- Q7: Tampilan dan desain menarik
- Q8: Informasi di layar jelas
- Q9: Sistem responsif dan cepat
- Q10: Pesan error jelas dan membantu

All Required: YES

---

#### SECTION 3: FUNGSIONALITAS CORE

**Q11-Q14: Rating Scale (1-5)**
- Q11: Fitur-fitur utama berfungsi baik
- Q12: Fitur yang paling sering digunakan (Checkbox - multiple)
- Q13: Data yang ditampilkan akurat
- Q14: Sistem menyediakan semua fitur yang dibutuhkan

---

#### SECTION 4: ROLE-SPECIFIC (Use Conditional Logic)

**Add Section → Set Condition Based on Q1**

Jika Q1 = "Admin Sistem":
```
Q15: Saya dapat dengan mudah membuat, mengubah, dan mengelola pengguna
Q16: Fitur manajemen siswa berfungsi dengan baik
Q17: Log aktivitas membantu saya memonitor pengguna lain
Q18: Proses persetujuan siswa baru mudah dan jelas
```

Jika Q1 = "Bendahara/Treasurer":
```
Q15: Saya dapat dengan mudah membuat tagihan bulanan
Q16: Proses pencatatan pembayaran manual jelas
Q17: Filter dan pencarian tagihan membantu
Q18: Laporan keuangan membantu analisis
Q19: Saya dapat dengan mudah export data
```

Jika Q1 = "Siswa/Wali Murid":
```
Q15: Saya dapat dengan mudah melihat detail tagihan SPP
Q16: Riwayat pembayaran ditampilkan dengan jelas
Q17: Saya dapat melihat profil data dengan mudah
Q18: Status pembayaran ditampilkan dengan jelas
```

Jika Q1 = "Kepala Sekolah/Headmaster":
```
Q15: Dashboard memberikan ringkasan keuangan yang dibutuhkan
Q16: Saya dapat mengakses laporan dan analisis yang relevan
```

---

#### SECTION 5: KEAMANAN & PRIVASI

**Q20-Q22: Rating Scale (1-5)**
- Q20: Proses password reset aman
- Q21: Data pribadi terlindungi dengan baik
- Q22: Saya hanya bisa melihat data sesuai peran saya

---

#### SECTION 6: KEPUASAN KESELURUHAN

**Q23: Overall Satisfaction**
- Type: Linear Scale 1-5
- Label: "Secara keseluruhan, saya puas dengan sistem ini"

**Q24: Rekomendasi**
- Type: Multiple Choice
- Options:
  - Tidak, saya tidak merekomendasikan
  - Mungkin, dengan beberapa perbaikan
  - Ya, saya merekomendasikan
  - Ya, saya sangat merekomendasikan

**Q25: Penggunaan Lanjutan**
- Type: Multiple Choice
- Options:
  - Tidak, saya akan mencari alternatif lain
  - Mungkin, tergantung perbaikan yang dilakukan
  - Ya, saya akan terus menggunakannya
  - Ya, saya lebih suka sistem ini

---

#### SECTION 7: MASALAH & SARAN

**Q26: Bug/Error yang Dialami**
- Type: Long Text (Paragraph)
- Helper Text: "Jelaskan secara detail jika ada"
- Required: NO

**Q27: Fitur yang Hilang**
- Type: Long Text
- Helper Text: "Sebutkan fitur penting yang seharusnya ada"
- Required: NO

**Q28: Saran Perbaikan**
- Type: Long Text
- Helper Text: "Usability, performance, fitur, atau aspek lain"
- Required: NO

**Q29: Area untuk Ditingkatkan**
- Type: Checkbox (Multiple)
- Options:
  - Kemudahan penggunaan/UI
  - Kecepatan sistem/Performance
  - Kelengkapan fitur
  - Keamanan data
  - Laporan dan Analytics
  - Mobile compatibility
  - Notifikasi dan Alert
  - Dokumentasi/Bantuan
  - Customer Support
  - Lainnya

---

#### SECTION 8: PELATIHAN & DUKUNGAN

**Q30: Kejelasan Panduan**
- Type: Linear Scale 1-5

**Q31: Pelatihan yang Diterima**
- Type: Multiple Choice
- Options:
  - Belum pernah
  - Pelatihan singkat (<1 jam)
  - Pelatihan standar (1-2 jam)
  - Pelatihan lengkap (>2 jam)

**Q32: Dukungan Teknis**
- Type: Linear Scale 1-5

---

#### SECTION 9: KONFORMITAS BISNIS

**Q33-Q35: Rating Scale (1-5)**
- Q33: Sistem sesuai dengan kebutuhan bisnis sekolah
- Q34: Sistem membantu bekerja lebih efisien
- Q35: Investasi sebanding dengan manfaat

---

#### SECTION 10: MASA DEPAN

**Q36: Fitur Tambahan Diinginkan**
- Type: Checkbox (Multiple)
- Options:
  - Aplikasi Mobile (Android/iOS)
  - Integrasi dengan sistem lain
  - Advanced analytics
  - WhatsApp integration
  - Payment gateway integration
  - Sistem pengingat otomatis
  - Manajemen kelas
  - Fitur penilaian/rapor
  - Dashboard customizable
  - Two-Factor Authentication
  - Lainnya

**Q37: Frekuensi Update**
- Type: Multiple Choice
- Options:
  - Setiap bulan
  - Setiap 3 bulan
  - Setiap 6 bulan
  - Setahun sekali
  - Kapan pun ada perbaikan penting

---

#### SECTION 11: FOLLOW-UP

**Q38: Bersedia Diskusi Lanjutan**
- Type: Multiple Choice
- Options:
  - Tidak
  - Ya, melalui email
  - Ya, melalui telepon
  - Ya, pertemuan tatap muka

**Q39: Email (Opsional)**
- Type: Short Text
- Helper Text: "Email Anda untuk follow-up"
- Required: NO
- Response Validation: Email format

**Q40: Telepon (Opsional)**
- Type: Short Text
- Helper Text: "Nomor HP/Telepon untuk follow-up"
- Required: NO

---

### Step 5: Konfigurasi Submission

**Di menu ⋮ (More) → Settings**

```
Notification settings:
☑ Get email notifications for each response
☑ Show summary after submission
  - Custom message: "Terima kasih atas feedback Anda! 
                    Umpan balik Anda sangat berharga untuk 
                    peningkatan sistem kami."

Response collection:
☑ Show progress bar
☑ Shuffle question order? NO (keep order)
```

---

### Step 6: Customize Appearance

**Colors & Fonts:**
1. Klik tombol palet warna di kanan atas
2. Pilih tema sesuai brand sekolah
3. Customize font jika diperlukan

**Logo:**
1. Klik "Upload image" di header
2. Upload logo sekolah (PNG/JPG)
3. Set sebagai "Left aligned" atau "Right aligned"

---

### Step 7: Preview & Test

**Preview Form:**
1. Klik tombol "Eye" (Preview) di kanan atas
2. Coba jawab seluruh form
3. Pastikan:
   - Conditional logic bekerja
   - Semua pertanyaan tampil dengan baik
   - Tidak ada typo
   - Mobile view responsif

---

## 📤 DISTRIBUSI FORM

### Step 8: Dapatkan Link Sharing

1. Klik tombol "Send" di kanan atas
2. Pilih tab "Link"
3. Copy link (atau buat short URL)

### Step 9: Pilih Metode Distribusi

**Option A: Email Distribution**
```
Subject: 📋 Kami Membutuhkan Feedback Anda - UAT KASSMPIT Dashboard

Body:
Dear [Role],

Kami dengan senang hati mengundang Anda untuk berpartisipasi dalam 
User Acceptance Testing untuk sistem KASSMPIT Admin Dashboard kami.

Feedback Anda sangat penting untuk memastikan sistem ini memenuhi 
kebutuhan sekolah kami.

Silakan klik link di bawah untuk mengisi form UAT:
[INSERT SHORT URL]

⏱️ Durasi: ~10-15 menit
📅 Deadline: [DATE]

Terima kasih atas partisipasi Anda!

Best regards,
[Your Name]
```

**Option B: WhatsApp Distribution**
```
📋 *User Acceptance Testing - KASSMPIT Dashboard*

Halo,

Kami meminta feedback Anda tentang sistem KASSMPIT Dashboard kami.

Silakan isi form berikut (5-10 menit):
[SHORT URL]

Deadline: [DATE]

Terima kasih! 🙏
```

**Option C: In-App Notification**
```
Add popup/banner di dashboard system:
"📋 Kami membutuhkan feedback Anda!
Silakan isi survei UAT singkat kami: [BUTTON: Buka Form]"
```

**Option D: QR Code**
```
Generate QR code dari form link
Print dan tempel di:
- Ruang admin
- Ruang bendahara
- Board pengumuman
- Masjid/Area keluarga
```

---

## 📊 MONITORING PROGRESS

### Dashboard Monitoring:
1. Buka Google Form → Klik "Responses"
2. Di tab "Summary", lihat:
   - Total responses: X
   - Response rate timeline
   - Most common answers
   - Average ratings

### Set Target Response:
- Min responses needed: 50 (30% dari total users)
- Ideal responses: 100+ (60%+ coverage)

### Timeline Monitoring:
- Kirim first reminder: Day 3
- Kirim second reminder: Day 5
- Kirim final reminder: Day 6

---

## 📈 ANALYTICS & REPORTING

### Auto-Generate Reports:

**Google Form bawaan:**
1. Responses tab → Summary view
2. Individual question analytics
3. Export data to Google Sheets

**Custom Report Template:**

Create Google Sheets dengan formula:
```
=ARRAYFORMULA(QUERY(...))
```

Untuk visualisasi:
- Pie chart untuk multiple choice
- Bar chart untuk rating averages
- Word cloud untuk open-ended responses

---

## 🎯 BEST PRACTICES

### 1. Timing
- ⏰ Jangan kirim di akhir hari (Friday) atau libur
- ⏰ Kirim di pagi hari (8-10 AM) untuk engagement lebih baik
- ⏰ Durasi UAT: 5-7 hari

### 2. Reminders
- ✉️ Day 1: Initial distribution
- ✉️ Day 3: First reminder
- ✉️ Day 5: Second reminder  
- ✉️ Day 6: Last chance
- ✉️ Day 8: Thank you message + preview hasil

### 3. Incentives (Optional)
```
"Setiap peserta yang menyelesaikan UAT akan mendapat:
✓ Sertifikat partisipasi
✓ Undian hadiah menarik
✓ Prioritas dalam fitur request Anda"
```

### 4. Communication
- Buat simple FAQ sheet
- Setup email support: uat@school.edu
- Siapkan 1-2 orang untuk menjawab pertanyaan

### 5. Data Privacy
```
Add disclaimer:
"Data yang dikumpulkan hanya untuk improvement sistem.
Semua informasi akan dijaga kerahasiaannya dan 
tidak akan dibagikan ke pihak ketiga."
```

---

## 📋 CHECKLIST SEBELUM LAUNCH

- [ ] Semua pertanyaan sudah diinput dengan benar
- [ ] Preview form selesai dan tidak ada error
- [ ] Conditional logic sudah ditest
- [ ] Mobile view sudah dicek
- [ ] Logo dan theme sudah disetup
- [ ] Notifikasi email sudah dikonfigurasi
- [ ] Test responses sudah dihapus (jika ada)
- [ ] Link sharing sudah ready
- [ ] Recipients list sudah siap (email/WhatsApp contacts)
- [ ] Reminder schedule sudah direncanakan
- [ ] Response analytics sudah siap
- [ ] Reporting template sudah disiapkan
- [ ] Backup data strategy sudah ada

---

## 🎁 POST-UAT ACTIVITIES

### Setelah Form Ditutup:

1. **Export Data**
   ```
   Responses tab → Download responses (.xlsx)
   ```

2. **Analyze Results**
   - Calculate average ratings
   - Identify pain points
   - Categorize feature requests
   - Count bug reports

3. **Generate Report**
   - Use template di file berikutnya
   - Include charts & visualizations
   - Highlight top issues
   - Recommendations

4. **Share Findings**
   - Executive summary ke management
   - Detailed analysis ke development team
   - Thank you message ke participants

5. **Action Planning**
   - Prioritize issues
   - Assign to development team
   - Plan next iteration
   - Set implementation timeline

---

## 🔗 USEFUL LINKS

- Google Forms: https://forms.google.com
- Form Settings Tips: https://support.google.com/docs/answer/7032287
- Conditional Logic: https://support.google.com/docs/answer/7322678
- QR Code Generator: https://qr-code-generator.com

---

**Panduan Setup Lengkap - Siap untuk diimplementasikan!**

