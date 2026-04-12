import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        table: {
          include: {
            floor: {
              include: { branch: true },
            },
          },
        },
        items: {
          include: {
            product: {
              include: { category: true },
            },
            variant: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate tax breakdown
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxItems = order.items.map(item => ({
      name: item.product.name,
      variant: item.variant ? `${item.variant.attribute}: ${item.variant.value}` : null,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      taxPercent: item.product.tax || 0,
      taxAmount: item.price * item.quantity * ((item.product.tax || 0) / 100),
      isVegetarian: item.product.isVegetarian,
    }));

    const totalTax = taxItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        note: order.note,
        isQrOrder: order.isQrOrder,
      },
      table: order.table ? {
        number: order.table.number,
        floor: order.table.floor?.name || 'Main',
        branch: order.table.floor?.branch?.name || 'Main Branch',
      } : null,
      items: taxItems,
      totals: {
        subtotal,
        cgst,
        sgst,
        totalTax,
        grandTotal: subtotal + totalTax,
      },
      payment: order.payment ? {
        method: order.payment.method,
        amount: order.payment.amount,
        paidAt: order.payment.paidAt,
      } : null,
    });
  } catch (e) {
    console.error('INVOICE_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
