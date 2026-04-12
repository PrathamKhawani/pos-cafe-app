import { NextRequest, NextResponse } from 'next/server';
import { queryCustom } from '@/backend/database/direct';

export async function GET() {
  try {
    const categories = await queryCustom('SELECT * FROM "Category" ORDER BY "order" ASC');
    return NextResponse.json(categories);
  } catch (e: any) {
    console.error('CATEGORIES_GET_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Database execution failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is mandatory' }, { status: 400 });

    const lastRows = await queryCustom('SELECT "order" FROM "Category" ORDER BY "order" DESC LIMIT 1');
    const lastOrder = lastRows.length > 0 ? lastRows[0].order : -1;
    
    // Insert new category
    const res = await queryCustom(
      'INSERT INTO "Category" (id, name, color, "order", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [Math.random().toString(36).substring(2, 15), name, color || '#3b82f6', lastOrder + 1]
    );

    return NextResponse.json(res[0]);
  } catch (e: any) {
    console.error('CATEGORIES_POST_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Database execution failed' }, { status: 500 });
  }
}
