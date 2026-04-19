import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTreasurer } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.incomeCategoryOption.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching income categories:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat kategori pemasukan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const category = await prisma.incomeCategoryOption.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error creating income category:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambah kategori pemasukan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const name = String(body?.name || '').trim();

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID dan nama kategori wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.incomeCategoryOption.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.incomeCategoryOption.update({
        where: { id },
        data: { name, isActive: true },
      });

      await tx.cashLedgerEntry.updateMany({
        where: { direction: 'INCOME', category: existing.name },
        data: { category: name },
      });
    });

    return NextResponse.json({ success: true, message: 'Kategori pemasukan berhasil diubah' });
  } catch (error) {
    console.error('Error updating income category:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah kategori pemasukan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireTreasurer(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID kategori wajib diisi' }, { status: 400 });
    }

    const category = await prisma.incomeCategoryOption.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const usageCount = await prisma.cashLedgerEntry.count({
      where: { direction: 'INCOME', category: category.name },
    });

    if (usageCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Kategori tidak bisa dihapus karena sudah dipakai transaksi pemasukan.',
      }, { status: 400 });
    }

    await prisma.incomeCategoryOption.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Kategori pemasukan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting income category:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus kategori pemasukan' }, { status: 500 });
  }
}
