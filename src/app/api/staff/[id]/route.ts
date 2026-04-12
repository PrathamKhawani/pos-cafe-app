import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/backend/database/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Prevent Admin from deleting themselves (safety check)
    if (payload.userId === params.id) {
        return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    // Delete associated sessions first (though Prisma CASCADE should handle it if defined, 
    // but better to be safe if not explicit)
    await prisma.session.deleteMany({ where: { userId: params.id } });

    // Revoke access by setting isApproved to false
    await prisma.user.update({
      where: { id: params.id },
      data: { isApproved: false },
    });

    return NextResponse.json({ success: true, message: 'Access revoked successfully' });
  } catch (error: any) {
    console.error('STAFF_DELETE_ERROR:', error);
    return NextResponse.json({ error: 'Failed to remove staff account' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { role } = await req.json();

    if (!['ADMIN', 'CASHIER', 'KITCHEN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent Admin from changing their own role (safety check)
    if (payload.userId === params.id) {
        return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('STAFF_ROLE_UPDATE_ERROR:', error);
    return NextResponse.json({ error: 'Failed to update staff role' }, { status: 500 });
  }
}
