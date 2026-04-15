export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, getTokenFromRequest } from '@/backend/database/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  tax: z.number().min(0).default(0),
  note: z.string().optional()
});

const orderSchema = z.object({
  tableId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  note: z.string().optional(),
  isQrOrder: z.boolean().default(false),
  items: z.array(orderItemSchema).min(1)
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const branchId = searchParams.get('branchId') || req.cookies.get('branch-id')?.value;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderType = searchParams.get('orderType');
    const search = searchParams.get('search');
    
    // Auth context for branch filtering
    const token = getTokenFromRequest(req);
    const payload = token ? await verifyToken(token) : null;
    const isAsAdmin = payload?.role === 'ADMIN';

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (tableId) where.tableId = tableId;
    
    // Branch filtering: If admin and branchId is 'all', don't filter by branch.
    // Otherwise, use provided branchId or cookie branchId.
    if (isAsAdmin && (branchId === 'all' || branchId === 'ALL')) {
      // No branch filter for admin seeing all
    } else if (branchId) {
      where.branchId = branchId;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Order Type filtering (Dine-in vs Takeaway)
    if (orderType === 'DINE_IN') {
      where.tableId = { not: null };
    } else if (orderType === 'TAKEAWAY') {
      where.tableId = null;
    }

    // Search filtering (Order ID or Table Number)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { table: { number: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          table: { select: { number: true, floor: { select: { name: true, branch: { select: { name: true } } } } } },
          items: { include: { product: { select: { name: true, imageUrl: true, isVegetarian: true } }, variant: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (e) {
    console.error('ORDERS_GET_ERROR:', e);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const cookieStore = cookies();
    const branchId = cookieStore.get('branch-id')?.value;
    const payload = token ? await verifyToken(token) : null;

    const body = await req.json();
    const validatedData = orderSchema.parse(body);

    const total = validatedData.items.reduce(
      (sum: number, item: any) => sum + (item.price * item.quantity * (1 + (item.tax || 0) / 100)),
      0
    );


    const order = await prisma.order.create({
      data: {
        tableId: validatedData.tableId,
        sessionId: validatedData.sessionId,
        branchId,
        userId: payload?.userId,
        total,
        note: validatedData.note,
        isQrOrder: validatedData.isQrOrder,
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
        },
      },
      include: {
        table: true,
        items: { include: { product: { include: { category: true } }, variant: true } },
      },
    });

    return NextResponse.json(order);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.issues }, { status: 400 });
    }
    console.error('ORDERS_POST_ERROR:', e);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
