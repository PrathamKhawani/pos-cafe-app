import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Update individual item status/preparedness
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { itemId, isPrepared, status } = await req.json();
    
    // If status is provided, use it. If only isPrepared is provided (old UI), map it.
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.isPrepared = status === 'READY' || status === 'DELIVERED';
    } else if (isPrepared !== undefined) {
      updateData.isPrepared = isPrepared;
      updateData.status = isPrepared ? 'READY' : 'PREPARING';
    }

    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });
    
    return NextResponse.json(item);
  } catch (e) {
    console.error('ITEM_UPDATE_ERROR:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
