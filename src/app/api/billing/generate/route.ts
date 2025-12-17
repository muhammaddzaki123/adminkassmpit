import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

/**
 * POST /api/billing/generate
 * Generate tagihan SPP bulanan untuk siswa aktif
 * 
 * Body:
 * - month: number (1-12)
 * - year: number (2024, 2025, etc.)
 * - academicYearId: string (UUID)
 * - classIds: string[] (optional, jika kosong = semua kelas)
 * - type: 'SPP' | 'DAFTAR_ULANG' | 'KEGIATAN' | etc.
 * - description: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !['TREASURER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only treasurer or admin can generate billings' },
        { status: 403 }
      );
    }

    const { month, year, academicYearId, classIds, type, description } = await request.json();

    // Validate required fields
    if (!month || !year || !academicYearId || !type) {
      return NextResponse.json(
        { error: 'Month, year, academicYearId, and type are required' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1-12' },
        { status: 400 }
      );
    }

    // Validate academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Get active students in specified classes (or all)
    const studentClassWhere: Prisma.StudentClassWhereInput = {
      isActive: true,
      academicYearId,
    };

    if (classIds && classIds.length > 0) {
      studentClassWhere.classId = { in: classIds };
    }

    const studentClasses = await prisma.studentClass.findMany({
      where: studentClassWhere,
      include: {
        student: true,
        class: true,
      },
    });

    if (studentClasses.length === 0) {
      return NextResponse.json(
        { error: 'No active students found for the selected criteria' },
        { status: 404 }
      );
    }

    // Generate billings
    const results: {
      success: Array<{ studentId: string; studentName: string; nisn: string; class: string; billNumber: string; amount: number }>;
      failed: Array<{ studentId: string; studentName: string; error: string }>;
      skipped: Array<{ studentId: string; studentName: string; reason: string; billNumber: string }>;
    } = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const sc of studentClasses) {
      if (!sc.student) continue;

      try {
        // Check if billing already exists
        const existing = await prisma.billing.findFirst({
          where: {
            studentId: sc.student.id,
            type,
            month,
            year,
            academicYearId,
          },
        });

        if (existing) {
          results.skipped.push({
            studentId: sc.student.id,
            studentName: sc.student.nama,
            reason: 'Billing already exists',
            billNumber: existing.billNumber,
          });
          continue;
        }

        // Generate bill number: INV/TAHUN/BULAN/NOMOR
        const billCount = await prisma.billing.count({
          where: {
            year,
            month,
          },
        });
        const billNumber = `INV/${year}/${String(month).padStart(2, '0')}/${String(billCount + 1).padStart(4, '0')}`;

        // Get amount from class sppAmount (untuk SPP) or use default
        let amount = 500000; // Default
        if (type === 'SPP' && sc.class.sppAmount > 0) {
          amount = sc.class.sppAmount;
        }

        // Set due date (tanggal 10 bulan berjalan)
        const dueDate = new Date(year, month - 1, 10);

        // Create billing
        const billing = await prisma.billing.create({
          data: {
            billNumber,
            studentId: sc.student.id,
            academicYearId,
            type,
            month,
            year,
            subtotal: amount,
            discount: 0,
            totalAmount: amount,
            paidAmount: 0,
            status: 'BILLED',
            dueDate,
            billDate: new Date(),
            description: description || `${type} ${getMonthName(month)} ${year}`,
            issuedBy: session.user.id,
          },
        });

        results.success.push({
          studentId: sc.student.id,
          studentName: sc.student.nama,
          nisn: sc.student.nisn,
          class: sc.class.name,
          billNumber: billing.billNumber,
          amount: billing.totalAmount,
        });
      } catch (error) {
        results.failed.push({
          studentId: sc.student.id,
          studentName: sc.student.nama,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.success.length} billings successfully`,
      data: {
        generated: results.success.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
        details: results,
      },
    });
  } catch (error) {
    console.error('Error generating billings:', error);
    return NextResponse.json(
      { error: 'Failed to generate billings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || 'Unknown';
}
