import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const registrations = await prisma.student.findMany({
      where: {
        OR: [
          { status: 'PENDING_REGISTRATION' },
          { status: 'ACTIVE', enrollmentType: 'NEW' }, // Show recently approved
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil data pendaftaran' },
      { status: 500 }
    );
  }
}
