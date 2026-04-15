import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (e) {
    console.error('CUSTOMERS_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = customerSchema.parse(body);

    const customer = await prisma.customer.upsert({
      where: { phone: validatedData.phone },
      update: { name: validatedData.name },
      create: {
        name: validatedData.name,
        phone: validatedData.phone,
      },
    });

    return NextResponse.json(customer);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 });
    }
    console.error('CUSTOMERS_POST_ERROR:', e);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
