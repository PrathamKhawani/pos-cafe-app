import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        table: { select: { number: true, floor: { select: { name: true } } } },
        items: { include: { product: { select: { name: true, price: true, imageUrl: true } }, variant: true } },
        payment: true,
        session: { select: { id: true, openedAt: true } },
      },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    console.error('ORDER_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { 
        table: { select: { number: true } }, 
        items: { include: { product: { select: { name: true } }, variant: true } }, 
        payment: true 
      },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error('ORDER_PUT_ERROR:', e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({ 
      where: { id: params.id },
      select: { status: true }
    });
    
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT orders can be deleted' }, { status: 400 });
    }
    
    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('ORDER_DELETE_ERROR:', e);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
