import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface StudentRow {
  nisn: string;
  nama: string;
  kelas: string;
  email: string;
  noTelp: string;
  alamat: string;
  namaOrangTua: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    
    // Parse CSV
    const lines = text.split('\n');
    // Skip header line (index 0)
    
    const students: StudentRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      if (values.length < 8) continue;
      
      students.push({
        nisn: values[0],
        nama: values[1],
        kelas: values[2],
        email: values[3],
        noTelp: values[4],
        alamat: values[5],
        namaOrangTua: values[6],
        password: values[7] || 'student123', // Default password if not provided
      });
    }

    // Process each student
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; nisn: string; error: string }[],
    };

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNumber = i + 2; // +2 because of header and 0-index

      try {
        // Validate
        if (!student.nisn || student.nisn.length !== 10) {
          throw new Error('NISN harus 10 digit');
        }

        // Check if NISN exists
        const existing = await prisma.student.findUnique({
          where: { nisn: student.nisn },
        });

        if (existing) {
          throw new Error('NISN sudah terdaftar');
        }

        // Check if email exists
        const existingEmail = await prisma.user.findUnique({
          where: { email: student.email },
        });

        if (existingEmail) {
          throw new Error('Email sudah digunakan');
        }

        // Generate VA
        const vaNumber = `8808${Date.now().toString().slice(-6)}${i}`;

        // Hash password
        const hashedPassword = await bcrypt.hash(student.password, 10);

        // Use transaction to ensure both Student and User are created together
        await prisma.$transaction(async (tx) => {
          // Create Student
          const newStudent = await tx.student.create({
            data: {
              nisn: student.nisn,
              nama: student.nama,
              kelas: student.kelas,
              email: student.email,
              noTelp: student.noTelp,
              alamat: student.alamat,
              namaOrangTua: student.namaOrangTua,
              status: 'ACTIVE',
              virtualAccount: vaNumber,
              enrollmentType: 'CONTINUING',
              academicYear: '2024/2025',
            },
          });

          // Create User account
          await tx.user.create({
            data: {
              username: student.nisn,
              email: student.email,
              password: hashedPassword,
              nama: student.nama,
              role: 'STUDENT',
              studentId: newStudent.id,
              isActive: true,
            },
          });
        });

        results.success++;
      } catch (error) {
        console.error(`Error importing student ${student.nisn}:`, error);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          nisn: student.nisn,
          error: error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat import' },
      { status: 500 }
    );
  }
}
