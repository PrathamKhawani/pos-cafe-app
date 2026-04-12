import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().min(0),
  tax: z.number().min(0).default(0),
  uom: z.string().optional().default('Unit'),
  priceTaxIncluded: z.boolean().default(true),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isVegetarian: z.boolean().default(true),
  variants: z.array(z.object({
    attribute: z.string().min(1),
    value: z.string().min(1),
    extraPrice: z.number().min(0).default(0)
  })).optional()
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        variants: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(products);
  } catch (e: any) {
    console.error('PRODUCTS_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        categoryId: validatedData.categoryId,
        price: validatedData.price,
        tax: validatedData.tax,
        uom: validatedData.uom,
        priceTaxIncluded: validatedData.priceTaxIncluded,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        isVegetarian: validatedData.isVegetarian,
        variants: {
          create: validatedData.variants?.map(v => ({
            attribute: v.attribute,
            value: v.value,
            extraPrice: v.extraPrice
          }))
        }
      },
      include: {
        category: true,
        variants: true
      }
    });

    return NextResponse.json(product);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 });
    }
    console.error('PRODUCTS_POST_ERROR:', e);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
