import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Data siswa
      nisn,
      nama,
      kelas,
      email,
      noTelp,
      alamat,
      namaOrangTua,
      // Account settings
      username, // Optional, default = NISN
      password, // Optional, default = NISN
      academicYear, // Optional, default = current year
    } = body;

    // Validasi
    if (!nisn || !nama || !kelas) {
      return NextResponse.json(
        { error: 'NISN, nama, dan kelas wajib diisi' },
        { status: 400 }
      );
    }

    // Check if NISN exists in Student
    const existingStudent = await prisma.student.findUnique({
      where: { nisn },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'NISN sudah terdaftar sebagai siswa' },
        { status: 400 }
      );
    }

    // Check if NISN exists in NewStudent
    const existingNewStudent = await prisma.newStudent.findUnique({
      where: { nisn },
    });

    if (existingNewStudent) {
      return NextResponse.json(
        { error: 'NISN sudah terdaftar sebagai calon siswa' },
        { status: 400 }
      );
    }

    // Generate defaults
    const finalUsername = username || `${nisn}_student`;
    const finalPassword = password || nisn; // Default password = NISN
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Get current academic year if not provided
    const now = new Date();
    const currentYear = now.getFullYear();
    const finalAcademicYear = academicYear || 
      (now.getMonth() >= 6 
        ? `${currentYear}/${currentYear + 1}` 
        : `${currentYear - 1}/${currentYear}`);

    // Create Student and User in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Student
      const student = await tx.student.create({
        data: {
          nisn,
          nama,
          kelas,
          email,
          noTelp,
          alamat,
          namaOrangTua,
          status: 'ACTIVE',
          enrollmentType: 'NEW',
          academicYear: finalAcademicYear,
          sppStatus: 'UNPAID',
          daftarUlangStatus: 'UNPAID',
        },
      });

      // Create User account
      const user = await tx.user.create({
        data: {
          username: finalUsername,
          password: hashedPassword,
          nama,
          email,
          role: 'STUDENT',
          studentId: student.id,
          isActive: true,
        },
      });

      return { student, user, plainPassword: finalPassword };
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan',
      data: {
        student: {
          id: result.student.id,
          nisn: result.student.nisn,
          nama: result.student.nama,
          kelas: result.student.kelas,
        },
        credentials: {
          username: result.user.username,
          password: result.plainPassword,
          note: 'Password default adalah NISN siswa. Harap diubah setelah login pertama.',
        },
      },
    });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat siswa' },
      { status: 500 }
    );
  }
}
