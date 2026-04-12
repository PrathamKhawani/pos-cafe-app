import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Resolve QR token → table + menu
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const qr = await prisma.qRToken.findUnique({
      where: { token: params.token },
      include: { table: { include: { floor: true } } },
    });
    if (!qr) return NextResponse.json({ error: 'Invalid QR token' }, { status: 404 });

    const config = await prisma.pOSConfig.findFirst();
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: { category: true, variants: true },
      orderBy: { name: 'asc' },
    });
    const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });

    return NextResponse.json({
      table: qr.table,
      products,
      categories,
      config,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
