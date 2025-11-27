import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const period = searchParams.get('period');

    const where: Record<string, unknown> = {};

    // Filter by category
    if (category && category !== 'all') {
      where.category = category as ExpenseCategory;
    }

    // Filter by period
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      data: expenses 
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch expenses' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, category, description, amount, status } = body;

    // Validasi input
    if (!date || !category || !description || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Data tidak lengkap. date, category, description, dan amount wajib diisi' 
      }, { status: 400 });
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nominal harus lebih dari 0' 
      }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        category: category as ExpenseCategory,
        description,
        amount: parseFloat(amount),
        status: (status as ExpenseStatus) || ExpenseStatus.APPROVED,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: expense,
      message: 'Pengeluaran berhasil disimpan'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan saat menyimpan pengeluaran' 
    }, { status: 500 });
  }
}
