import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Data pribadi
      nama,
      nisn,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      alamat,
      noTelp,
      email,
      // Data orang tua
      namaAyah,
      namaIbu,
      noTelpOrtu,
      pekerjaanAyah,
      pekerjaanIbu,
      // Pendaftaran
      enrollmentType, // NEW atau TRANSFER
      kelasYangDituju,
      asalSekolah,
      // Login credentials
      password,
    } = body;

    // Validasi required fields
    if (!nama || !nisn || !kelasYangDituju || !enrollmentType || !password) {
      return NextResponse.json(
        { error: 'Data wajib belum lengkap' },
        { status: 400 }
      );
    }

    // Check if NISN already exists
    const existingNisn = await prisma.newStudent.findUnique({
      where: { nisn },
    });

    if (existingNisn) {
      return NextResponse.json(
        { error: 'NISN sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if NISN exists in Student (siswa resmi)
    const existingStudent = await prisma.student.findUnique({
      where: { nisn },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'NISN sudah terdaftar sebagai siswa resmi. Gunakan login siswa.' },
        { status: 400 }
      );
    }

    // Get current academic year (contoh: 2024/2025)
    const now = new Date();
    const currentYear = now.getFullYear();
    const academicYear = now.getMonth() >= 6 
      ? `${currentYear}/${currentYear + 1}` 
      : `${currentYear - 1}/${currentYear}`;

    // Get registration fee from settings (default 500000)
    const feeSettings = await prisma.systemSettings.findFirst({
      where: { key: 'REGISTRATION_FEE' },
    });
    const registrationFee = feeSettings ? parseFloat(feeSettings.value) : 500000;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create NewStudent and User in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create NewStudent
      const newStudent = await tx.newStudent.create({
        data: {
          nama,
          nisn,
          tempatLahir,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
          jenisKelamin,
          agama,
          alamat,
          noTelp,
          email,
          namaAyah,
          namaIbu,
          noTelpOrtu,
          pekerjaanAyah,
          pekerjaanIbu,
          enrollmentType,
          academicYearId: academicYear,
          kelasYangDituju,
          asalSekolah,
          registrationFee,
          registrationPaid: false,
          approvalStatus: 'PENDING',
        },
      });

      // Create User account
      const user = await tx.user.create({
        data: {
          username: nisn, // NISN sebagai username
          password: hashedPassword,
          nama,
          email,
          role: 'NEW_STUDENT',
          newStudentId: newStudent.id,
          isActive: true, // NEW_STUDENT bisa login untuk tracking
        },
      });

      return { newStudent, user };
    });

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan login dengan NISN dan password Anda.',
      data: {
        id: result.newStudent.id,
        nama: result.newStudent.nama,
        nisn: result.newStudent.nisn,
        registrationFee: result.newStudent.registrationFee,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat pendaftaran' },
      { status: 500 }
    );
  }
}
