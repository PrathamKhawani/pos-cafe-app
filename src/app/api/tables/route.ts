import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // If ?all=1 is passed (by QR page), return all tables regardless of branch cookie
    const fetchAll = searchParams.get('all') === '1';
    const branchId = fetchAll ? null : req.cookies.get('branch-id')?.value;

    const tables = await prisma.table.findMany({
      where: branchId ? { floor: { branchId } } : {},
      include: {
        floor: true,       // includes floor.branchId needed for QR page filtering
        qrTokens: { take: 1 }
      },
      orderBy: { number: 'asc' }
    });

    return NextResponse.json(tables);
  } catch (e: any) {
    console.error('TABLES_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { floorId, number, seats, tableType, imageUrl } = await req.json();
    if (!floorId || !number) return NextResponse.json({ error: 'Floor and number are required' }, { status: 400 });

    const table = await prisma.table.create({
      data: {
        floorId,
        number,
        seats: parseInt(seats) || 4,
        tableType: tableType || 'Table',
        imageUrl: imageUrl || null,
        isActive: true
      },
      include: { floor: true }
    });

    return NextResponse.json(table);
  } catch (e: any) {
    console.error('TABLES_POST_ERROR:', e);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
