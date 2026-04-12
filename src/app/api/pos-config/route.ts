import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function GET() {
  try {
    let config = await prisma.pOSConfig.findFirst();
    if (!config) {
      config = await prisma.pOSConfig.create({ data: {} });
    }
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    let config = await prisma.pOSConfig.findFirst();
    if (!config) {
      config = await prisma.pOSConfig.create({ data });
    } else {
      config = await prisma.pOSConfig.update({ where: { id: config.id }, data });
    }
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
