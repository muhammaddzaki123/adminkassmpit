import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    // Simplified date filtering for this example
    // In production, would handle date ranges properly

    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category as ExpenseCategory;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, category, description, amount, receipt } = body;

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        category: category as ExpenseCategory,
        description,
        amount: parseFloat(amount),
        status: ExpenseStatus.PENDING,
        receipt,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
