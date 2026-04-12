import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { closingCash } = await req.json();
    const session = await prisma.session.update({
      where: { id: params.id },
      data: { closedAt: new Date(), closingCash: parseFloat(closingCash) || 0 },
    });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
