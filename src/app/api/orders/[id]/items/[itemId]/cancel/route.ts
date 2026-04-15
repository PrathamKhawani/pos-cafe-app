import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const { id, itemId } = params;

    // 1. Fetch the order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 2. Update the specific item
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { isCancelled: true },
    });

    // 3. Recalculate the total from non-cancelled items
    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId: id, isCancelled: false }
    });

    const newTotal = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 4. Update the order total
    // If no items are left, we could mark the whole order as CANCELLED
    const updateData: any = { total: newTotal };
    if (remainingItems.length === 0) {
      updateData.status = 'CANCELLED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: { select: { name: true } }, variant: true } },
        table: { select: { number: true } },
        customer: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (e) {
    console.error('ITEM_CANCEL_ERROR:', e);
    return NextResponse.json({ error: 'Failed to cancel item' }, { status: 500 });
  }
}
