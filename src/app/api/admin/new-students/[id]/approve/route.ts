import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-helpers';

// POST: Approve calon siswa dan buat Student baru (ADMIN ONLY)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { 
      adminId, // User ID admin yang approve
      kelas, // Kelas yang diberikan (bisa beda dari kelasYangDituju)
      notes,
    } = body;

    if (!kelas) {
      return NextResponse.json(
        { error: 'Kelas harus ditentukan' },
        { status: 400 }
      );
    }

    // Get NewStudent data
    const newStudent = await prisma.newStudent.findUnique({
      where: { id: id },
      include: { user: true },
    });

    if (!newStudent) {
      return NextResponse.json(
        { error: 'Data calon siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    if (newStudent.approvalStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Calon siswa sudah diapprove sebelumnya' },
        { status: 400 }
      );
    }

    // Check if NISN already exists in Student
    const existingStudent = await prisma.student.findUnique({
      where: { nisn: newStudent.nisn },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'NISN sudah terdaftar sebagai siswa resmi' },
        { status: 400 }
      );
    }

    // Create new Student and User account in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update NewStudent status
      await tx.newStudent.update({
        where: { id: id },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
          notes,
        },
      });

      // 2. Create Student (siswa resmi)
      const student = await tx.student.create({
        data: {
          nama: newStudent.nama,
          nisn: newStudent.nisn,
          noTelp: newStudent.noTelp,
          email: newStudent.email,
          alamat: newStudent.alamat,
          namaOrangTua: `${newStudent.namaAyah || ''} / ${newStudent.namaIbu || ''}`.trim(),
          status: 'ACTIVE',
          enrollmentType: newStudent.enrollmentType,
          admissionDate: new Date(),
        },
      });

      // 3. Generate new username and password for STUDENT role
      const studentUsername = `${newStudent.nisn}_student`;
      const defaultPassword = newStudent.nisn; // Default password = NISN
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 4. Create User account for STUDENT role
      const studentUser = await tx.user.create({
        data: {
          username: studentUsername,
          password: hashedPassword,
          nama: newStudent.nama,
          email: newStudent.email,
          role: 'STUDENT',
          studentId: student.id,
          isActive: true,
        },
      });

      // 5. Deactivate NEW_STUDENT user account (tidak delete, untuk history)
      if (newStudent.user) {
        await tx.user.update({
          where: { id: newStudent.user.id },
          data: { isActive: false },
        });
      }

      return { student, studentUser, defaultPassword };
    });

    return NextResponse.json({
      success: true,
      message: 'Calon siswa berhasil diterima dan dibuat akun siswa resmi',
      data: {
        student: result.student,
        credentials: {
          username: result.studentUser.username,
          password: result.defaultPassword, // Send to admin to give to student
          note: 'Password default adalah NISN siswa. Harap diberitahukan kepada siswa untuk mengganti password.',
        },
      },
    });
  } catch (error) {
    console.error('Approve new student error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat approve' },
      { status: 500 }
    );
  }
}

// DELETE: Reject calon siswa
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { adminId, rejectionReason } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Alasan penolakan harus diisi' },
        { status: 400 }
      );
    }

    await prisma.newStudent.update({
      where: { id: id },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran ditolak',
    });
  } catch (error) {
    console.error('Reject new student error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat reject' },
      { status: 500 }
    );
  }
}
