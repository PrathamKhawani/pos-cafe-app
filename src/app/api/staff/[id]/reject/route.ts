import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, getTokenFromRequest } from '@/backend/database/auth';

// DELETE /api/staff/[id]/reject
// Permanently deletes a pending (unapproved) staff registration.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });

    // Verify live DB role — JWT can be stale after role promotion
    const liveUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { role: true },
    });

    const userRole = String(liveUser?.role ?? payload.role).toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // Prevent Admin from deleting themselves
    if (payload.userId === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    // Ensure the target user is still pending (not yet approved)
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { isApproved: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUser.isApproved) {
      return NextResponse.json(
        { error: 'Cannot reject an already-approved user. Use Revoke Access instead.' },
        { status: 400 }
      );
    }

    // Delete dependent sessions first (safe-guard if Prisma cascade is not configured)
    await prisma.session.deleteMany({ where: { userId: params.id } });

    // Permanently delete the pending user record
    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Registration rejected and account removed.' });
  } catch (error: any) {
    console.error('STAFF_REJECT_ERROR:', error);
    return NextResponse.json({ error: 'Failed to reject registration.' }, { status: 500 });
  }
}
