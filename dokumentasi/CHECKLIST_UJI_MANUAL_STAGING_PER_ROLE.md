# Checklist Uji Manual Staging Per Role

Tanggal: 2026-03-17
Tujuan: verifikasi cepat bahwa fitur antar role terhubung dan tidak menggunakan data dummy.

## A. Bendahara

1. Login bendahara berhasil.
2. Dashboard bendahara menampilkan ringkasan data keuangan aktual.
3. Generate tagihan bulanan berhasil untuk kelas terpilih.
4. Daftar tagihan tampil sesuai filter (status/jenis/bulan/tahun).
5. Input pembayaran manual berhasil mengubah status billing.
6. Pembayaran online (create) menghasilkan `externalId` dan instruksi bayar.
7. Webhook callback sukses mengubah payment ke `COMPLETED`.
8. Webhook callback duplikat tidak menambah paidAmount (idempotent).
9. Backup data menghasilkan file JSON nyata dan dapat diunduh.
10. Riwayat backup tampil dari data persisted.

## B. Siswa/Wali Murid

1. Login siswa berhasil.
2. Halaman SPP menampilkan tagihan aktual siswa login.
3. Pembayaran SPP online bisa dibuat (status awal `PENDING`).
4. Setelah webhook sukses, status pembayaran dan tagihan terupdate otomatis.
5. Riwayat pembayaran menampilkan transaksi terbaru.
6. Profil siswa dapat dibuka dan data valid.
7. Halaman daftar ulang (jika ada tagihan) memuat status terbaru.

## C. Admin

1. Login admin berhasil.
2. Dashboard admin menampilkan statistik user aktual.
3. Aktivitas terbaru di dashboard bukan dummy (sumber API DB).
4. Halaman Activity Log memuat data aktual + filter bekerja.
5. Create user berhasil dan activity log tercatat.
6. Update user berhasil dan activity log tercatat.
7. Toggle status user berhasil dan activity log tercatat.
8. Delete user berhasil dan activity log tercatat.
9. Halaman data siswa: aksi arsip siswa berjalan (tidak TODO/placeholder).
10. Registrasi calon siswa dapat diproses dengan data academic year aktif.

## D. Kepala Sekolah

1. Login kepala sekolah berhasil.
2. Dashboard laporan dapat diakses read-only sesuai role.
3. Data ringkasan keuangan terbaca dari data aktual.
4. Tidak ada akses write untuk aksi admin/bendahara.

## E. Calon Siswa (Alur Pendaftaran)

1. Register calon siswa berhasil saat tahun ajaran aktif tersedia.
2. Jika tahun ajaran aktif tidak tersedia, muncul error valid.
3. Login calon siswa berhasil setelah registrasi.
4. Endpoint status pendaftaran menampilkan data milik user login (bukan data user lain).

## F. Validasi Umum Staging

1. `npm run lint` tanpa warning/error baru.
2. `npm run build` sukses.
3. Tidak ada response HTML tak terduga pada endpoint JSON.
4. Data antar role konsisten setelah aksi lintas role.

## Sign-off

- QA Bendahara: [ ]
- QA Siswa/Wali: [ ]
- QA Admin: [ ]
- QA Kepala Sekolah: [ ]
- QA Calon Siswa: [ ]
- Tech Lead Approval: [ ]
