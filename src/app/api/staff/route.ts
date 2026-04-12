import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/backend/database/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    // Dynamic role check (v1.2) - more resilient
    const userRole = String(payload.role).toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: `Access denied. Role ${userRole} is not authorized.` }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['CASHIER', 'KITCHEN', 'ADMIN']
        }
      },
      select: {
         id: true,
         name: true,
         username: true,
         email: true,
         role: true,
         isApproved: true,
         createdAt: true
      },
      orderBy: {
         createdAt: 'desc'
      }
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('STAFF_FETCH_ERROR:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
