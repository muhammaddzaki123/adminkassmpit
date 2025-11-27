import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nisn, nama, kelas, email, password, noTelp, alamat, namaOrangTua } = body;

    // Validation
    if (!nisn || !nama || !email || !password) {
      return NextResponse.json(
        { message: 'NISN, nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Check if NISN already exists
    const existingStudent = await prisma.student.findUnique({
      where: { nisn },
    });

    if (existingStudent) {
      return NextResponse.json(
        { message: 'NISN sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // Get registration fee from settings
    const registrationFeeSetting = await prisma.systemSettings.findUnique({
      where: { key: 'REGISTRATION_FEE' },
    });

    const registrationFee = registrationFeeSetting 
      ? parseFloat(registrationFeeSetting.value) 
      : 500000;

    // Generate Virtual Account (simple implementation)
    const vaNumber = `8808${Date.now().toString().slice(-6)}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Student with PENDING status
    const student = await prisma.student.create({
      data: {
        nisn,
        nama,
        kelas,
        email,
        noTelp,
        alamat,
        namaOrangTua,
        status: 'ACTIVE',
        virtualAccount: vaNumber,
        enrollmentType: 'NEW',
        academicYear: '2024/2025',
      },
    });

    // Create User account
    await prisma.user.create({
      data: {
        username: nisn, // Username = NISN
        email,
        password: hashedPassword,
        nama,
        role: 'STUDENT', // STUDENT role for direct registration
        studentId: student.id,
        isActive: true, // Active immediately
      },
    });

    // Create Transaction record
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 24); // 24 hours expiry

    await prisma.transaction.create({
      data: {
        studentId: student.id,
        paymentType: 'DAFTAR_ULANG',
        paymentMethod: 'VIRTUAL_ACCOUNT',
        amount: registrationFee,
        totalAmount: registrationFee,
        status: 'PENDING',
        vaNumber,
        expiredAt,
        description: 'Biaya Pendaftaran Siswa Baru',
      },
    });

    return NextResponse.json({
      message: 'Pendaftaran berhasil! Silakan lakukan pembayaran.',
      student: {
        id: student.id,
        nisn: student.nisn,
        nama: student.nama,
      },
      payment: {
        vaNumber,
        amount: registrationFee,
        expiredAt: expiredAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat pendaftaran' },
      { status: 500 }
    );
  }
}
