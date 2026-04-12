import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // ?branchId=xxx → filter by that branch
    // ?all=1           → return all floors (for admin Floors & Tables page)
    // default          → use branch-id cookie (for POS view)
    const fetchAll = searchParams.get('all') === '1';
    const queryBranch = searchParams.get('branchId');
    const branchId = fetchAll ? null : (queryBranch || req.cookies.get('branch-id')?.value);

    const floors = await prisma.floor.findMany({
      where: branchId ? { branchId } : {},
      include: {
        branch: { select: { id: true, name: true } },
        tables: { orderBy: { number: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(floors);
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, branchId } = await req.json();
    const floor = await prisma.floor.create({
      data: { name, branchId },
      include: {
        branch: { select: { id: true, name: true } },
        tables: true,
      },
    });
    return NextResponse.json(floor);
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
