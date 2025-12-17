import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTreasurer } from '@/lib/auth-helpers';

// POST - Give discount to a billing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireTreasurer();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { session } = authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const { discountAmount, discountReason } = body;

    // Validate input
    if (!discountAmount || discountAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid discount amount' },
        { status: 400 }
      );
    }

    if (!discountReason || discountReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Discount reason is required' },
        { status: 400 }
      );
    }

    // Check if billing exists
    const billing = await prisma.billing.findUnique({
      where: { id }
    });

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }

    // Check if billing is already paid or waived
    if (billing.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot give discount to already paid billing' },
        { status: 400 }
      );
    }

    if (billing.status === 'WAIVED') {
      return NextResponse.json(
        { error: 'Cannot give discount to waived billing' },
        { status: 400 }
      );
    }

    // Validate discount amount doesn't exceed total
    if (discountAmount >= billing.totalAmount) {
      return NextResponse.json(
        { error: 'Discount amount cannot be greater than or equal to total amount' },
        { status: 400 }
      );
    }

    // Calculate new total
    const newTotal = billing.totalAmount - discountAmount;

    // Update billing with discount
    const updatedBilling = await prisma.$transaction([
      prisma.billing.update({
        where: { id },
        data: {
          discount: discountAmount,
          discountReason,
          totalAmount: newTotal
        }
      }),
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'APPLY_DISCOUNT',
          entity: 'Billing',
          entityId: id,
          details: JSON.stringify({
            discountAmount,
            discountReason,
            oldTotal: billing.totalAmount,
            newTotal
          })
        }
      })
    ]);

    return NextResponse.json({ 
      message: 'Discount applied successfully',
      billing: updatedBilling[0]
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
}
