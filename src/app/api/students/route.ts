import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BillingStatus, PaymentType, Prisma, StudentStatus } from '@prisma/client';
import { requireDashboardAccess } from '@/lib/auth-helpers';

function getMonthLabel(month?: number | null) {
  if (!month || month < 1 || month > 12) return '-';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return months[month - 1];
}

function getSppPeriodLabel(month?: number | null, year?: number | null) {
  if (!year) return '-';
  return month ? `${getMonthLabel(month)} ${year}` : String(year);
}

export async function GET(request: NextRequest) {
  const authResult = await requireDashboardAccess(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.StudentWhereInput = {};

    if (kelas && kelas !== 'all') {
      where.studentClasses = {
        some: {
          isActive: true,
          class: {
            name: kelas,
          },
        },
      };
    }

    if (status && status !== 'all') {
      where.status = status as StudentStatus;
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        studentClasses: {
          where: {
            isActive: true,
          },
          orderBy: {
            enrollmentDate: 'desc',
          },
          take: 1,
          include: {
            class: true,
            academicYear: true,
          },
        },
        billings: {
          where: {
            type: PaymentType.SPP,
          },
          orderBy: [
            { year: 'asc' },
            { month: 'asc' },
            { billDate: 'asc' },
          ],
          select: {
            id: true,
            billNumber: true,
            status: true,
            month: true,
            year: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
            billDate: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    const data = students.map((student) => {
      const currentClass = student.studentClasses[0];
      const sppBillings = student.billings;
      const firstSpp = sppBillings[0];
      const latestSpp = sppBillings[sppBillings.length - 1];

      const statusCounts = sppBillings.reduce<Record<string, number>>((acc, billing) => {
        acc[billing.status] = (acc[billing.status] || 0) + 1;
        return acc;
      }, {});

      const sppSummary = {
        totalTagihan: sppBillings.length,
        periodAwal: firstSpp ? getSppPeriodLabel(firstSpp.month, firstSpp.year) : '-',
        periodTerbaru: latestSpp ? getSppPeriodLabel(latestSpp.month, latestSpp.year) : '-',
        statusTerbaru: latestSpp?.status || null,
        billNumberTerbaru: latestSpp?.billNumber || null,
        statusCounts: {
          paid: statusCounts[BillingStatus.PAID] || 0,
          partial: statusCounts[BillingStatus.PARTIAL] || 0,
          billed: statusCounts[BillingStatus.BILLED] || 0,
          overdue: statusCounts[BillingStatus.OVERDUE] || 0,
          cancelled: statusCounts[BillingStatus.CANCELLED] || 0,
          waived: statusCounts[BillingStatus.WAIVED] || 0,
          unbilled: statusCounts[BillingStatus.UNBILLED] || 0,
        },
      };

      const sppDetails = sppBillings.map((billing) => ({
        id: billing.id,
        billNumber: billing.billNumber,
        status: billing.status,
        period: getSppPeriodLabel(billing.month, billing.year),
        month: billing.month,
        year: billing.year,
        totalAmount: billing.totalAmount,
        paidAmount: billing.paidAmount,
        dueDate: billing.dueDate,
        billDate: billing.billDate,
      }));

      return {
        id: student.id,
        nama: student.nama,
        nisn: student.nisn,
        kelas: currentClass ? `${currentClass.class.name}` : '-',
        academicYear: currentClass ? currentClass.academicYear.year : '-',
        status: student.status,
        email: student.email,
        noTelp: student.noTelp,
        enrollmentType: student.enrollmentType,
        sppSummary,
        sppDetails,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch students' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireDashboardAccess(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { nama, nisn, status } = body;

    const student = await prisma.student.create({
      data: {
        nama,
        nisn,
        status: status || StudentStatus.ACTIVE,
        enrollmentType: 'CONTINUING',
      },
    });

    return NextResponse.json({
      success: true,
      data: student,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create student' 
    }, { status: 500 });
  }
}
