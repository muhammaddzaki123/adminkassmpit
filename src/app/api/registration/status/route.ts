import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || session.user.role !== 'NEW_STUDENT' || !session.user.newStudentId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newStudent = await prisma.newStudent.findUnique({
      where: { id: session.user.newStudentId },
    });

    if (!newStudent) {
      return NextResponse.json(
        { message: 'Data pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      nisn: newStudent.nisn,
      nama: newStudent.nama,
      status: newStudent.approvalStatus,
      virtualAccount: newStudent.virtualAccount || '-',
      registrationPaid: newStudent.registrationPaid,
    });
  } catch (error) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
