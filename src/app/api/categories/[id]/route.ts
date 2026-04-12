import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const category = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error deleting category:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : 'Unknown error') }, { status: 500 });
  }
}
