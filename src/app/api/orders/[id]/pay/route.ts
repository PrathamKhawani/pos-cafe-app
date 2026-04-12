import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Pay an order
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { method, amount } = await req.json();
    // Start transaction to update order and create payment
    const [order, payment] = await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      const current = await tx.order.findUnique({ where: { id: params.id } });
      
      // 2. Determine new status: Only 'PAID' if already 'READY'
      const newStatus = (current?.status === 'READY') ? 'PAID' : current?.status;

      const updated = await tx.order.update({
        where: { id: params.id },
        data: { status: newStatus || 'PAID' },
        include: { table: true, items: { include: { product: { include: { category: true } } } } },
      });

      const created = await tx.payment.create({
        data: { orderId: params.id, method, amount: parseFloat(amount) },
      });

      return [updated, created];
    });
    return NextResponse.json({ order, payment });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
