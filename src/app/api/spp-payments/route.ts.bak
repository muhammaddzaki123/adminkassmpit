import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const studentId = searchParams.get('studentId');

    const where: Record<string, unknown> = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (kelas && kelas !== 'all') {
      where.student = { kelas: kelas };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const payments = await prisma.sPPPayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            kelas: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch SPP payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, paymentType, amount, month, year, paidAt, description, status } = body;

    // Validasi input
    if (!studentId || !paymentType || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Data tidak lengkap. studentId, paymentType, dan amount wajib diisi' 
      }, { status: 400 });
    }

    // Validasi student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: 'Siswa tidak ditemukan' 
      }, { status: 404 });
    }

    // Jika SPP, validasi bulan dan tahun tidak boleh duplikat
    if (paymentType === 'SPP' && month && year) {
      const existingPayment = await prisma.sPPPayment.findFirst({
        where: {
          studentId,
          paymentType,
          month,
          year,
          status: 'PAID'
        }
      });

      if (existingPayment) {
        return NextResponse.json({ 
          success: false, 
          error: `Pembayaran SPP untuk bulan ${month}/${year} sudah ada` 
        }, { status: 400 });
      }
    }

    const payment = await prisma.sPPPayment.create({
      data: {
        studentId,
        paymentType,
        amount: parseFloat(amount.toString()),
        month: month ? parseInt(month.toString()) : null,
        year: year ? parseInt(year.toString()) : null,
        status: status || 'PAID',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        description: description || null,
      },
      include: {
        student: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            kelas: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: payment,
      message: 'Pembayaran berhasil disimpan'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan saat menyimpan pembayaran' 
    }, { status: 500 });
  }
}
