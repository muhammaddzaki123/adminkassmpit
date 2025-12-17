import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // TODO: Get from session/auth
    // For now, get from query or session
    // const { userId } = await getSession();
    
    // Example: Get student data
    // Replace with actual auth logic
    const user = await prisma.user.findFirst({
      where: { role: 'NEW_STUDENT' },
      include: { student: true },
    });

    if (!user || !user.student) {
      return NextResponse.json(
        { message: 'Data pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      nisn: user.student.nisn,
      nama: user.student.nama,
      status: user.student.status,
      virtualAccount: user.student.virtualAccount || '-',
    });
  } catch (error) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
