# ERD KASSMPIT - Documentation

## Overview
ERD (Entity-Relationship Diagram) untuk sistem **KASSMPIT** (Kas SPP MPIT) menggunakan **Chen Notation** (model ERD klasik) yang sudah **ternormalisasi hingga 3NF (Third Normal Form)**.

---

## File ERD
📄 **File:** `ERD-KASSMPIT.drawio`  
🔧 **Editor:** [Draw.io](https://app.diagrams.net/) atau VS Code extension Draw.io Integration

### Cara Membuka & Edit:
1. **Online:** Upload file ke https://app.diagrams.net/
2. **Offline:** Install aplikasi Draw.io Desktop
3. **VS Code:** Install extension "Draw.io Integration" by Henning Dieterichs

---

## Notasi Chen (Chen Notation)

### Simbol Utama:
| Simbol | Keterangan |
|--------|-----------|
| **Persegi panjang** | Entity (entitas kuat) |
| **Persegi panjang ganda** | Weak Entity (entitas lemah - bergantung pada entitas lain) |
| **Belah ketupat** | Relationship (hubungan antar entitas) |
| **Belah ketupat ganda** | Identifying Relationship (hubungan identifikasi untuk weak entity) |
| **Oval** | Atribut biasa |
| **Oval garis putus-putus** | Multi-valued attribute (atribut bernilai banyak) |
| **Atribut bergaris bawah** | Primary Key (kunci utama) |
| **UQ** | Unique key (kunci unik) |

### Kardinalitas:
- **1** = One (satu)
- **N** = Many (banyak)
- **0..1** = Optional one (opsional)
- **M:N** = Many-to-many
- **Garis putus-putus** = Optional relationship

---

## Entitas Utama (14 Entities)

### 1. **Student** (Strong Entity)
- **PK:** student_id
- **Atribut:** nama, nisn (UQ), kelas
- **Multi-valued:** phone (dapat memiliki banyak nomor telepon)
- **Relasi:** 
  - 1:N dengan Invoice (identifying relationship)
  - 1:N dengan Notification

### 2. **Invoice** (Weak Entity)
- **Owner:** Student
- **Partial Key:** invoice_no + period
- **Identifying Relationship:** Student "has Invoice"
- **Relasi:**
  - N:1 dengan Fee
  - 1:N dengan Payment

### 3. **Fee**
- **PK:** fee_id
- **Atribut:** name (SPP, Pendaftaran, Daftar Ulang, dll.), amount
- **Relasi:** 1:N dengan Invoice

### 4. **Payment**
- **PK:** payment_id
- **Atribut:** paid_at, amount
- **Multi-valued:** receipt_images (dapat upload banyak bukti)
- **Relasi:**
  - N:1 dengan Invoice
  - N:1 dengan PaymentMethod

### 5. **PaymentMethod** (Lookup Table)
- **PK:** method_id
- **Atribut:** name (Tunai, Virtual Account, E-wallet)
- **Relasi:** 1:N dengan Payment

### 6. **User**
- **PK:** user_id
- **Atribut:** username (UQ), role (Admin, Bendahara, Kepala Sekolah)
- **Relasi:**
  - 1:N dengan Expense (created by)
  - 1:N dengan AuditLog (performed by)

### 7. **Expense**
- **PK:** expense_id
- **Atribut:** amount, description
- **Multi-valued:** receipt_images
- **Relasi:**
  - N:1 dengan User
  - 0..1:0..1 dengan Transaction (optional)

### 8. **Transaction** (General Ledger)
- **PK:** tx_id
- **Atribut:** type (income/expense), amount, description
- **Relasi:** 0..1:0..1 dengan Expense (optional link)

### 9. **Notification**
- **PK:** notif_id
- **Atribut:** message, status
- **Relasi:** N:1 dengan Student

### 10. **Applicant** (Calon Siswa)
- **PK:** applicant_id
- **Atribut:** nama, email, phone
- **Relasi:** 1:N dengan Registration (identifying)

### 11. **Registration** (Weak Entity)
- **Owner:** Applicant
- **Partial Key:** reg_no
- **Identifying Relationship:** Applicant "registers"
- **Atribut:** status, submitted_at

### 12. **Settings**
- **PK:** setting_id
- **Atribut:** key (UQ), value
- **Keterangan:** Key-value store untuk konfigurasi sistem

### 13. **AuditLog**
- **PK:** log_id
- **Atribut:** action, timestamp
- **Relasi:** N:1 dengan User
- **Keterangan:** Tracking aktivitas pengguna

### 14. **Backup**
- **PK:** backup_id
- **Atribut:** file_path, created_at
- **Keterangan:** Record backup database

---

## Normalisasi (3NF)

### ✅ First Normal Form (1NF)
- ✔️ Semua atribut bernilai atomic (tidak ada repeating groups)
- ✔️ Multi-valued attributes dipisah (phone, receipt_images menggunakan simbol khusus)

### ✅ Second Normal Form (2NF)
- ✔️ Semua atribut non-key bergantung penuh pada primary key
- ✔️ Tidak ada partial dependency
- ✔️ Weak entities (Invoice, Registration) memiliki composite key

### ✅ Third Normal Form (3NF)
- ✔️ Tidak ada transitive dependency
- ✔️ Non-key attributes hanya bergantung pada PK
- ✔️ Lookup tables terpisah (PaymentMethod, Fee)
- ✔️ Settings menggunakan key-value pattern (normalisasi sempurna)

---

## Mapping ke Prisma Schema

### Contoh Konversi:

#### **Student Entity** → Prisma Model:
```prisma
model Student {
  id        String   @id @default(cuid()) // student_id
  nama      String
  nisn      String   @unique
  kelas     String
  phones    Phone[]  // multi-valued attribute
  invoices  Invoice[] // 1:N relationship
  notifications Notification[] // 1:N relationship
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Phone {
  id        String  @id @default(cuid())
  number    String
  studentId String
  student   Student @relation(fields: [studentId], references: [id])
}
```

#### **Invoice (Weak Entity)** → Prisma Model:
```prisma
model Invoice {
  id        String   @id @default(cuid())
  invoiceNo String   // partial key
  period    String   // partial key (YYYY-MM)
  studentId String
  feeId     String
  student   Student  @relation(fields: [studentId], references: [id])
  fee       Fee      @relation(fields: [feeId], references: [id])
  payments  Payment[]
  
  @@unique([studentId, period]) // composite key for weak entity
}
```

#### **Multi-valued Attributes** → Separate Table:
```prisma
model PaymentReceipt {
  id        String  @id @default(cuid())
  imageUrl  String
  paymentId String
  payment   Payment @relation(fields: [paymentId], references: [id])
}
```

---

## Tips Penggunaan

### 🎨 Editing di Draw.io:
1. **Zoom:** Ctrl + Mouse Wheel
2. **Pan:** Klik kanan + drag atau Space + drag
3. **Edit teks:** Double-click pada shape
4. **Tambah entity:** Klik kanan → Insert → Rectangle
5. **Tambah relationship:** Gunakan Diamond dari sidebar
6. **Tambah atribut:** Gunakan Ellipse dari sidebar
7. **Hubungkan:** Klik connector (Ctrl+E) lalu drag dari entity ke relationship

### 📊 Best Practices:
- **Weak entity:** Selalu gunakan double border dan identifying relationship
- **Multi-valued:** Gunakan dashed oval untuk atribut seperti phone, images
- **Kardinalitas:** Letakkan di dekat entity (bukan di tengah garis)
- **Optional:** Gunakan garis putus-putus untuk relasi optional (0..1)

### 🔄 Update ke Database:
1. Edit ERD sesuai kebutuhan
2. Update `prisma/schema.prisma` berdasarkan ERD baru
3. Generate migration: `npx prisma migrate dev --name [nama_perubahan]`
4. Apply: `npx prisma db push`

---

## Changelog
- **v1.0** (2025-11-30): Initial ERD dengan 14 entities, 3NF normalization, Chen notation

---

## Referensi
- Chen Notation: [Wikipedia - ER Diagram](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model)
- Normalization: [Database Normalization](https://www.guru99.com/database-normalization.html)
- Draw.io: https://app.diagrams.net/
- Prisma Docs: https://www.prisma.io/docs
