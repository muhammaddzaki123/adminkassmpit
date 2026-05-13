import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/admin/students/[id]/delete
 * Permanently delete a student and all related records from database
 * Cascade delete will handle: StudentClass, Billing, Payment, PaymentDetail, StudentDiscountPlan, etc.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { session } = authResult;

    const { id: studentId } = await params;

    if (!studentId || studentId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        studentClasses: true,
        billings: true,
        discountPlans: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student tidak ditemukan' },
        { status: 404 }
      );
    }

    // Record deletion info for audit purposes (optional - you can save to audit log)
    const deletionInfo = {
      deletedAt: new Date(),
      deletedBy: session.user.username,
      studentName: student.nama,
      studentNisn: student.nisn,
      relatedRecords: {
        studentClassCount: student.studentClasses.length,
        billingCount: student.billings.length,
        discountPlanCount: student.discountPlans.length,
      },
    };

    // Delete Student (cascade will delete StudentClass, Billing, Payment, etc.)
    // Also delete related User account
    const deletedStudent = await prisma.$transaction(async (tx) => {
      // Delete student record (cascade deletes related records)
      const result = await tx.student.delete({
        where: { id: studentId },
      });

      // Delete user account if exists
      if (student.user) {
        await tx.user.delete({
          where: { id: student.user.id },
        });
      }

      return result;
    });

    // Log deletion (you can implement audit logging here)
    console.log('[STUDENT DELETION AUDIT]', deletionInfo);

    return NextResponse.json(
      {
        success: true,
        message: `Siswa ${student.nama} berhasil dihapus permanen dari database`,
        data: {
          deletedStudentId: deletedStudent.id,
          deletedStudentName: deletedStudent.nama,
          auditInfo: deletionInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE STUDENT ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus siswa',
      },
      { status: 500 }
    );
  }
}
