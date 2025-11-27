import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        registrationDate: 'desc',
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
