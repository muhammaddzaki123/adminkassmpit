import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTreasurer } from '@/lib/auth-helpers';

// POST - Waive a billing (full exemption)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { session } = authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const { waivedReason } = body;

    // Validate input
    if (!waivedReason || waivedReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Waiver reason is required' },
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
        { error: 'Cannot waive already paid billing' },
        { status: 400 }
      );
    }

    if (billing.status === 'WAIVED') {
      return NextResponse.json(
        { error: 'Billing is already waived' },
        { status: 400 }
      );
    }

    // Update billing to waived status
    const updatedBilling = await prisma.$transaction([
      prisma.billing.update({
        where: { id },
        data: {
          status: 'WAIVED',
          waivedAt: new Date(),
          waivedById: session.user.id,
          waivedReason
        }
      }),
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'WAIVE_BILLING',
          entity: 'Billing',
          entityId: id,
          details: JSON.stringify({
            waivedReason,
            originalAmount: billing.totalAmount
          })
        }
      })
    ]);

    return NextResponse.json({ 
      message: 'Billing waived successfully',
      billing: updatedBilling[0]
    });
  } catch (error) {
    console.error('Error waiving billing:', error);
    return NextResponse.json(
      { error: 'Failed to waive billing' },
      { status: 500 }
    );
  }
}
