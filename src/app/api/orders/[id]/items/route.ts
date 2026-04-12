import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Toggle item prepared status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { itemId, isPrepared } = await req.json();
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { isPrepared },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
