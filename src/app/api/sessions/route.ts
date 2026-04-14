export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { verifyToken, getTokenFromRequest } from '@/backend/database/auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || req.cookies.get('branch-id')?.value;

    const sessions = await prisma.session.findMany({
      where: branchId ? { branchId } : {},
      include: { user: { select: { name: true, email: true } }, branch: true },
      orderBy: { openedAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const cookieStore = cookies();
    const branchId = cookieStore.get('branch-id')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { openingCash } = await req.json();
    const session = await prisma.session.create({
      data: {
        userId: payload.userId,
        branchId,
        openingCash: parseFloat(openingCash) || 0
      },
      include: { user: { select: { name: true, email: true } }, branch: true },
    });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
