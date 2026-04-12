import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/backend/database/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });

    // Verify live DB role — JWT can be stale after role promotion
    const liveUser = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { role: true },
    });

    const userRole = String(liveUser?.role ?? payload.role).toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isApproved: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('STAFF_APPROVE_ERROR:', error);
    return NextResponse.json({ error: 'Failed to approve staff account' }, { status: 500 });
  }
}

