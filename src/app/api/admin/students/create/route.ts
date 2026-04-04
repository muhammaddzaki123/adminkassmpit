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
      classId,
      academicYearId,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      email,
      noTelp,
      alamat,
      namaOrangTua,
      namaAyah,
      namaIbu,
      noTelpOrtu,
      // Account settings
      username, // Optional, default = NISN
      password, // Optional, default = NISN
    } = body;

    // Validasi
    if (!nisn || !nama) {
      return NextResponse.json(
        { error: 'NISN dan nama wajib diisi' },
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

    // Create Student and User in transaction
    const result = await prisma.$transaction(async (tx) => {
      const activeAcademicYear = await tx.academicYear.findFirst({
        where: { isActive: true },
      });

      const matchedClass = classId
        ? await tx.class.findFirst({
            where: {
              id: classId,
              isActive: true,
            },
          })
        : kelas
          ? await tx.class.findFirst({
              where: {
                name: kelas,
                isActive: true,
              },
            })
          : null;

      const matchedAcademicYear = academicYearId
        ? await tx.academicYear.findFirst({
            where: {
              id: academicYearId,
            },
          })
        : await tx.academicYear.findFirst({
            where: { isActive: true },
          });

      const resolvedParentName =
        namaOrangTua || [namaAyah, namaIbu].filter(Boolean).join(' / ') || null;

      // Create Student
      const student = await tx.student.create({
        data: {
          nisn,
          nama,
          email,
          noTelp,
          alamat,
          namaOrangTua: resolvedParentName,
          noTelpOrangTua: noTelpOrtu || null,
          status: 'ACTIVE',
          enrollmentType: 'NEW',
          birthPlace: tempatLahir || null,
          birthDate: tanggalLahir ? new Date(tanggalLahir) : null,
          gender: jenisKelamin || null,
        },
      });

      if (matchedClass && matchedAcademicYear) {
        await tx.studentClass.create({
          data: {
            studentId: student.id,
            classId: matchedClass.id,
            academicYearId: matchedAcademicYear.id,
            isActive: true,
          },
        });
      }

      // Create User account
      const user = await tx.user.create({
        data: {
          username: finalUsername,
          password: hashedPassword,
          nama,
          email: null,
          role: 'STUDENT',
          studentId: student.id,
          isActive: true,
        },
      });

      return {
        student,
        user,
        plainPassword: finalPassword,
        assignedClass: matchedClass,
        assignedAcademicYear: matchedAcademicYear || activeAcademicYear,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan',
      data: {
        student: {
          id: result.student.id,
          nisn: result.student.nisn,
          nama: result.student.nama,
        },
        credentials: {
          username: result.user.username,
          password: result.plainPassword,
          note: 'Password default adalah NISN siswa. Harap diubah setelah login pertama.',
        },
        classAssigned: result.assignedClass ? `${result.assignedClass.grade}${result.assignedClass.name}` : kelas || null,
        academicYearAssigned: result.assignedAcademicYear?.year || null,
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
