import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

// GET - List all billing templates
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const templates = await prisma.billingTemplate.findMany({
      include: {
        items: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching billing templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing templates' },
      { status: 500 }
    );
  }
}

// POST - Create new billing template
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { session } = authResult;

  try {
    const body = await request.json();
    const { name, type, amount, academicYearId, description, dueDate, items } = body;

    // Validate required fields
    if (!name || !academicYearId || !dueDate || !type || amount === undefined) {
      return NextResponse.json(
        { error: 'Name, type, amount, academic year, and due date are required' },
        { status: 400 }
      );
    }

    // Create template with items
    const template = await prisma.billingTemplate.create({
      data: {
        name,
        type,
        amount,
        academicYearId,
        description,
        dueDate: new Date(dueDate),
        createdById: session.user.id,
        items: {
          create: items?.map((item: { itemName: string; amount: number; isRequired?: boolean }) => ({
            itemName: item.itemName,
            amount: item.amount,
            isRequired: item.isRequired ?? true
          })) || []
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({ 
      message: 'Billing template created successfully',
      template 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating billing template:', error);
    return NextResponse.json(
      { error: 'Failed to create billing template' },
      { status: 500 }
    );
  }
}
