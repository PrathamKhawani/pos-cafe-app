import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Pay an order
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { method, amount } = await req.json();
    // Start transaction to update order and create payment
    const [order, payment] = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch current status
      const current = await tx.order.findUnique({ where: { id: params.id } });
      
      // 2. Determine new status: DRAFT -> SENT (to kitchen), READY -> PAID
      let newStatus = current?.status;
      if (current?.status === 'DRAFT') newStatus = 'SENT';
      else if (current?.status === 'READY') newStatus = 'PAID';
      else newStatus = 'PAID';

      const updated = await tx.order.update({
        where: { id: params.id },
        data: { status: newStatus },
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
