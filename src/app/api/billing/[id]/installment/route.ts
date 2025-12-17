import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTreasurer } from '@/lib/auth-helpers';

// POST - Set installment plan for a billing
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
    const { installmentCount, installmentAmount } = body;

    // Validate input
    if (!installmentCount || installmentCount < 1 || !installmentAmount || installmentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid installment count or amount' },
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

    // Check if billing is already paid
    if (billing.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot set installments for already paid billing' },
        { status: 400 }
      );
    }

    // Calculate installment schedule
    const now = new Date();
    const installments = [];
    
    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        billingId: id,
        installmentNo: i,
        amount: installmentAmount,
        dueDate
      });
    }

    // Update billing and create installments in a transaction
    const result = await prisma.$transaction([
      // Update billing
      prisma.billing.update({
        where: { id },
        data: {
          allowInstallments: true,
          installmentCount,
          installmentAmount
        }
      }),
      // Create installment records
      prisma.installment.createMany({
        data: installments
      }),
      // Log activity
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'SET_INSTALLMENT',
          entity: 'Billing',
          entityId: id,
          details: JSON.stringify({
            installmentCount,
            installmentAmount,
            totalAmount: installmentAmount * installmentCount
          })
        }
      })
    ]);

    return NextResponse.json({ 
      message: 'Installment plan set successfully',
      billing: result[0],
      installmentsCreated: installmentCount
    });
  } catch (error) {
    console.error('Error setting installments:', error);
    return NextResponse.json(
      { error: 'Failed to set installments' },
      { status: 500 }
    );
  }
}

// GET - Get installment plan for a billing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireTreasurer();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  try {
    const billing = await prisma.billing.findUnique({
      where: { id },
      include: {
        installments: {
          orderBy: { installmentNo: 'asc' }
        }
      }
    });

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      billing,
      installments: billing.installments
    });
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installments' },
      { status: 500 }
    );
  }
}
