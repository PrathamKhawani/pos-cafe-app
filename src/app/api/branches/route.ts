import { NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        type: body.type,
        imageUrl: body.imageUrl,
      },
    });
    return NextResponse.json(branch);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
