import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { variants, ...data } = await req.json();
    if (data.price !== undefined) data.price = parseFloat(data.price);
    if (data.tax !== undefined) data.tax = parseFloat(data.tax);
    
    // Update product and variants
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        variants: variants ? {
          deleteMany: {},
          create: variants.map((v: any) => ({
            attribute: v.attribute,
            value: v.value,
            extraPrice: parseFloat(v.extraPrice || 0)
          }))
        } : undefined
      },
      include: { category: true, variants: true },
    });
    return NextResponse.json(product);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
