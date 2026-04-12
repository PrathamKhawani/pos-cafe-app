import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const branchId = req.cookies.get('branch-id')?.value;
    const tokens = await prisma.qRToken.findMany({
      where: branchId ? { table: { floor: { branchId } } } : {},
      include: { table: { include: { floor: { include: { branch: true } } } } },
    });
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tableId } = await req.json();
    const existing = await prisma.qRToken.findFirst({ where: { tableId } });
    if (existing) {
      return NextResponse.json(existing);
    }
    const token = await prisma.qRToken.create({
      data: { tableId },
      include: { table: true },
    });
    return NextResponse.json(token);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Bulk generate QR tokens for ALL tables that don't have one
export async function PUT() {
  try {
    const tablesWithoutQR = await prisma.table.findMany({
      where: { qrTokens: { none: {} } },
      select: { id: true },
    });

    if (tablesWithoutQR.length === 0) {
      return NextResponse.json({ message: 'All tables already have QR tokens', created: 0 });
    }

    const created = await prisma.$transaction(
      tablesWithoutQR.map(t =>
        prisma.qRToken.create({
          data: { tableId: t.id },
          include: { table: { include: { floor: { include: { branch: true } } } } },
        })
      )
    );

    return NextResponse.json({ message: `Generated ${created.length} QR tokens`, created: created.length, tokens: created });
  } catch (e) {
    console.error('BULK_QR_ERROR:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
