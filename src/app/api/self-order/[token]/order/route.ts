import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

// Customer submits order via QR
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const qr = await prisma.qRToken.findUnique({
      where: { token: params.token },
      include: { table: { include: { floor: { include: { branch: true } } } } },
    });
    if (!qr) return NextResponse.json({ error: 'Invalid QR token' }, { status: 404 });

    const config = await prisma.pOSConfig.findFirst();
    if (!config?.selfOrderEnabled) {
      return NextResponse.json({ error: 'Self ordering is disabled' }, { status: 403 });
    }

    const { items, note, customerName, customerPhone } = await req.json();
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number; tax?: number }) => 
        sum + item.price * item.quantity * (1 + (item.tax || 0) / 100),
      0
    );

    // Get branchId from table's floor's branch
    const branchId = qr.table?.floor?.branch?.id || null;

    const order = await prisma.order.create({
      data: {
        tableId: qr.tableId,
        branchId,
        total,
        note: [note, customerName ? `Customer: ${customerName}` : '', customerPhone ? `Phone: ${customerPhone}` : ''].filter(Boolean).join(' | ') || null,
        isQrOrder: true,
        status: 'DRAFT', // Not visible to kitchen until paid
        items: {
          create: items.map((item: { productId: string; variantId?: string; quantity: number; price: number }) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { 
        table: { include: { floor: true } }, 
        items: { include: { product: { include: { category: true } }, variant: true } } 
      },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
