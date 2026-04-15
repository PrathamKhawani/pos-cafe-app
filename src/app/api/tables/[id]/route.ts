import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { isOccupied } = body;

    const table = await prisma.table.update({
      where: { id: params.id },
      data: { isOccupied },
      include: { floor: true }
    });

    return NextResponse.json(table);
  } catch (e: any) {
    console.error('TABLE_PATCH_ERROR:', e);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}
