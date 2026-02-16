import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    // Create new student registration
    const newStudent = await prisma.newStudent.create({
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
        academicYearId: 'current-academic-year-id', // TODO: Get from active academic year
        enrollmentType: 'NEW',
        approvalStatus: 'PENDING',
        registrationPaid: false,
      },
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
