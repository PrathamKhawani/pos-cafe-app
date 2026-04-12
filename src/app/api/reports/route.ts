export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { queryCustom } from '@/backend/database/direct';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';
    const branchId = searchParams.get('branchId');
    
    let startDate = new Date();
    let prevStartDate = new Date();
    let daysDiff = 0;

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      daysDiff = 1;
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      daysDiff = 7;
    } else if (period === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 30);
      daysDiff = 30;
    } else if (period === 'yearly') {
      startDate.setDate(startDate.getDate() - 365);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 365);
      daysDiff = 365;
    }

    const startDateStr = startDate.toISOString();
    const prevStartDateStr = prevStartDate.toISOString();

    let branchFilter = '';
    const queryParams: any[] = [startDateStr];
    const prevQueryParams: any[] = [prevStartDateStr, startDateStr];

    if (branchId && branchId !== 'all') {
      branchFilter = ` AND "branchId" = $${queryParams.length + 1}`;
      queryParams.push(branchId);
      prevQueryParams.push(branchId);
    }

    // ── 1. Current Stats ──
    const summaryRows = await queryCustom(`
      SELECT 
        COUNT(*)::int AS "totalOrders",
        COALESCE(SUM(total), 0) AS "totalRevenue",
        COALESCE(AVG(total), 0) AS "avgOrderValue"
      FROM "Order"
      WHERE status = 'PAID' AND "createdAt" >= $1 ${branchFilter}
    `, queryParams);

    // ── 2. Previous Stats (for Growth) ──
    const prevSummaryRows = await queryCustom(`
      SELECT 
        COUNT(*)::int AS "totalOrders",
        COALESCE(SUM(total), 0) AS "totalRevenue"
      FROM "Order"
      WHERE status = 'PAID' AND "createdAt" >= $1 AND "createdAt" < $2 ${branchFilter.replace('$2', '$3')}
    `, prevQueryParams);

    const current = summaryRows[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
    const previous = prevSummaryRows[0] || { totalOrders: 0, totalRevenue: 0 };

    // ── 3. Branch Breakdown (always computed for 'all' selection) ──
    let branchBreakdown: any[] = [];
    if (!branchId || branchId === 'all') {
      const rows = await queryCustom(`
        SELECT 
          b.name,
          COALESCE(SUM(o.total), 0)::float AS revenue,
          COUNT(o.id)::int AS orders
        FROM "Branch" b
        LEFT JOIN "Order" o ON b.id = o."branchId" AND o.status = 'PAID' AND o."createdAt" >= $1
        GROUP BY b.id, b.name
        ORDER BY revenue DESC
      `, [startDateStr]);
      branchBreakdown = rows.map((r: any) => ({ ...r, revenue: parseFloat(r.revenue) || 0 }));
    }

    // ── 4. Top products by revenue ──
    const topProducts = await queryCustom(`
      SELECT 
        p.name,
        SUM(i.quantity)::int AS qty,
        SUM(i.price * i.quantity) AS revenue
      FROM "OrderItem" i
      JOIN "Product" p ON i."productId" = p.id
      WHERE i."orderId" IN (
        SELECT id FROM "Order" WHERE status = 'PAID' AND "createdAt" >= $1 ${branchFilter}
      )
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `, queryParams);

    // ── 5. Top categories by revenue ──
    const topCategories = await queryCustom(`
      SELECT 
        c.name,
        SUM(i.price * i.quantity) AS revenue
      FROM "OrderItem" i
      JOIN "Product" p ON i."productId" = p.id
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE i."orderId" IN (
        SELECT id FROM "Order" WHERE status = 'PAID' AND "createdAt" >= $1 ${branchFilter}
      )
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 10
    `, queryParams);

    // ── 6. Daily sales aggregation ──
    const dailySalesRows = await queryCustom(`
      SELECT 
        TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
        SUM(total) AS revenue
      FROM "Order"
      WHERE status = 'PAID' AND "createdAt" >= $1 ${branchFilter}
      GROUP BY day
      ORDER BY day ASC
    `, queryParams);

    const dailySales: Record<string, number> = {};
    dailySalesRows.forEach((row: any) => {
      dailySales[row.day] = parseFloat(row.revenue) || 0;
    });

    // ── 7. Hourly distribution ──
    const hourlyRows = await queryCustom(`
      SELECT 
        EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Asia/Kolkata')::int AS hour,
        COUNT(*)::int AS orders,
        SUM(total) AS revenue
      FROM "Order"
      WHERE status = 'PAID' AND "createdAt" >= $1 ${branchFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `, queryParams);

    const hourlyDistribution: Record<string, { orders: number; revenue: number }> = {};
    hourlyRows.forEach((row: any) => {
      const label = `${String(row.hour).padStart(2, '0')}:00`;
      hourlyDistribution[label] = { orders: row.orders, revenue: parseFloat(row.revenue) || 0 };
    });

    // ── 8. Payment method breakdown ──
    const paymentBreakdown = await queryCustom(`
      SELECT 
        pm.method,
        COUNT(*)::int AS count,
        SUM(pm.amount) AS total
      FROM "Payment" pm
      JOIN "Order" o ON pm."orderId" = o.id
      WHERE o.status = 'PAID' AND o."createdAt" >= $1 ${branchFilter}
      GROUP BY pm.method
      ORDER BY total DESC
    `, queryParams);

    return NextResponse.json({
      totalOrders: parseInt(current.totalOrders) || 0,
      totalRevenue: parseFloat(current.totalRevenue) || 0,
      avgOrderValue: parseFloat(current.avgOrderValue) || 0,
      prevTotalOrders: parseInt(previous.totalOrders) || 0,
      prevTotalRevenue: parseFloat(previous.totalRevenue) || 0,
      branchBreakdown,
      topProducts: (topProducts || []).map((p: any) => ({ ...p, revenue: parseFloat(p.revenue) || 0 })),
      topCategories: (topCategories || []).map((c: any) => ({ ...c, revenue: parseFloat(c.revenue) || 0 })),
      dailySales,
      hourlyDistribution,
      paymentBreakdown: (paymentBreakdown || []).map((p: any) => ({ ...p, total: parseFloat(p.total) || 0 })),
    });
  } catch (e: any) {
    console.error('REPORTS_GET_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Database execution failed' }, { status: 500 });
  }
}

