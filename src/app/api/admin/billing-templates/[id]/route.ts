import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

// GET - Get single billing template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  try {
    const template = await prisma.billingTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemName: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Billing template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching billing template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing template' },
      { status: 500 }
    );
  }
}

// PUT - Update billing template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, academicYear, description, dueDate, items } = body;

    // Check if template exists
    const existing = await prisma.billingTemplate.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Billing template not found' },
        { status: 404 }
      );
    }

    // Update template and items
    const template = await prisma.billingTemplate.update({
      where: { id },
      data: {
        name,
        academicYear,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items: items ? {
          deleteMany: {}, // Delete existing items
          create: items.map((item: { itemName: string; amount: number; isRequired?: boolean }) => ({
            itemName: item.itemName,
            amount: item.amount,
            isRequired: item.isRequired ?? true
          }))
        } : undefined
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({ 
      message: 'Billing template updated successfully',
      template 
    });
  } catch (error) {
    console.error('Error updating billing template:', error);
    return NextResponse.json(
      { error: 'Failed to update billing template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete billing template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  try {
    // Check if template is being used in any billings
    const usageCount = await prisma.billing.count({
      where: { templateId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is used in ${usageCount} billing(s)` },
        { status: 400 }
      );
    }

    // Delete template (items will be cascade deleted)
    await prisma.billingTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Billing template deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting billing template:', error);
    return NextResponse.json(
      { error: 'Failed to delete billing template' },
      { status: 500 }
    );
  }
}
