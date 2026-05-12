import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

function isPlanActiveForPeriod(startYear: number, startMonth: number, targetYear: number, targetMonth: number) {
  if (startYear < targetYear) return true;
  if (startYear > targetYear) return false;
  return startMonth <= targetMonth;
}

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
    const session = await getServerSession(request);
    
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
      if (!sc.student) {
        console.warn(`⚠️ Student data missing for studentClass ${sc.id}`);
        continue;
      }

      try {
        // Validate student has required fields
        if (!sc.student.id || !sc.student.nama || !sc.student.nisn) {
          throw new Error(`Student data incomplete: ${sc.student.id}`);
        }

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

        // Validate bill number is unique (safety check)
        const existingBillNumber = await prisma.billing.findUnique({
          where: { billNumber },
        });
        if (existingBillNumber) {
          throw new Error(`Bill number already exists: ${billNumber}`);
        }

        // Get amount from class sppAmount (untuk SPP) or use default
        let amount = 500000; // Default
        if (!sc.class) {
          throw new Error('Class data missing for this student enrollment');
        }

        if (type === 'SPP' && sc.class.sppAmount > 0) {
          amount = sc.class.sppAmount;
        }

        // Validate amount is positive
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error(`Invalid billing amount: ${amount}`);
        }

        // Apply recurring discount plan if available
        let discountPlan = null;
        try {
          discountPlan = await prisma.studentDiscountPlan.findFirst({
            where: {
              studentId: sc.student.id,
              type,
              isActive: true,
              monthsRemaining: {
                gt: 0,
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          });
        } catch (discountError) {
          console.warn(`⚠️ Could not fetch discount plan for student ${sc.student.nisn}:`, discountError);
          // Continue without discount plan - don't fail the entire billing
        }

        let appliedDiscount = 0;
        let appliedDiscountReason: string | null = null;
        if (
          discountPlan &&
          isPlanActiveForPeriod(discountPlan.startYear, discountPlan.startMonth, year, month)
        ) {
          const maxAllowedDiscount = Math.max(0, amount - 1);
          appliedDiscount = Math.min(discountPlan.discountAmount, maxAllowedDiscount);
          if (appliedDiscount > 0) {
            appliedDiscountReason = `[Diskon Berkelanjutan] ${discountPlan.reason}`;
          }
        }

        // Set due date (tanggal 10 bulan berjalan)
        const dueDate = new Date(year, month - 1, 10);

        // Validate dates
        if (!dueDate || isNaN(dueDate.getTime())) {
          throw new Error(`Invalid due date: year=${year}, month=${month}`);
        }

        // Validate session user
        if (!session.user || !session.user.id) {
          throw new Error('Invalid session user');
        }

        // Create billing
        const billing = await prisma.$transaction(async (tx) => {
          try {
            const created = await tx.billing.create({
              data: {
                billNumber,
                studentId: sc.student.id,
                academicYearId,
                type,
                month,
                year,
                subtotal: amount,
                discount: appliedDiscount,
                discountReason: appliedDiscountReason,
                totalAmount: amount - appliedDiscount,
                paidAmount: 0,
                allowInstallments: sc.student.allowInstallments || false,
                status: 'BILLED',
                dueDate,
                billDate: new Date(),
                description: description || `${type} ${getMonthName(month)} ${year}`,
                issuedById: session.user.id,
              },
            });

            if (discountPlan && appliedDiscount > 0) {
              const nextMonths = Math.max(0, discountPlan.monthsRemaining - 1);
              await tx.studentDiscountPlan.update({
                where: { id: discountPlan.id },
                data: {
                  monthsRemaining: nextMonths,
                  isActive: nextMonths > 0,
                  updatedAt: new Date(),
                },
              });
            }

            return created;
          } catch (txError) {
            console.error(`❌ Transaction error for student ${sc.student.nisn}:`, txError);
            throw txError;
          }
        });

        results.success.push({
          studentId: sc.student.id,
          studentName: sc.student.nama,
          nisn: sc.student.nisn,
          class: sc.class?.name || 'Unknown',
          billNumber: billing.billNumber,
          amount: billing.totalAmount,
        });
      } catch (error) {
        console.error(`❌ Billing generation failed for student ${sc.student.nisn}:`, error);
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
    console.error('❌ Error generating billings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { 
        error: 'Failed to generate billings', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
      },
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
