import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nisn,
      fullName,
      email,
      phone,
      gender,
      birthDate,
      birthPlace,
      address,
      parentName,
      parentPhone,
      previousSchool,
      gradeApplied,
      password,
    } = body;

    // Validate required fields
    if (!nisn || !fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if NISN already exists
    const existingStudent = await prisma.newStudent.findUnique({
      where: { nisn },
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'NISN already registered' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: nisn },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Akun dengan NISN/email tersebut sudah ada' },
        { status: 400 }
      );
    }

    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!activeAcademicYear) {
      return NextResponse.json(
        { success: false, error: 'Tahun ajaran aktif belum diatur' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student + login account transactionally
    const newStudent = await prisma.$transaction(async (tx) => {
      const created = await tx.newStudent.create({
        data: {
          nisn,
          nama: fullName,
          email,
          noTelp: phone,
          jenisKelamin: gender,
          tanggalLahir: birthDate ? new Date(birthDate) : null,
          tempatLahir: birthPlace,
          alamat: address,
          namaAyah: parentName,
          noTelpOrtu: parentPhone,
          asalSekolah: previousSchool,
          kelasYangDituju: gradeApplied,
          academicYearId: activeAcademicYear.id,
          enrollmentType: 'NEW',
          approvalStatus: 'PENDING',
          registrationPaid: false,
        },
      });

      await tx.user.create({
        data: {
          username: nisn,
          email,
          password: hashedPassword,
          nama: fullName,
          role: 'NEW_STUDENT',
          newStudentId: created.id,
          isActive: true,
        },
      });

      return created;
    });

    // Generate virtual account for registration payment
    const vaNumber = `8001${nisn.substring(0, 6)}`;
    const registrationFee = 500000; // Default registration fee

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: newStudent.id,
        nisn: newStudent.nisn,
        nama: newStudent.nama,
      },
      payment: {
        vaNumber,
        amount: registrationFee,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    });
  } catch (error) {
    console.error('Error in public registration:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
