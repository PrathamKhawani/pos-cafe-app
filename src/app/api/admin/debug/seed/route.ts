import { NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Seeding database via API route...');

    // Clear existing floors and tables
    await prisma.table.deleteMany({});
    await prisma.floor.deleteMany({});

    // Create Ground Floor (6 tables)
    await prisma.floor.create({
      data: {
        name: 'Ground Floor',
        tables: {
          create: [
            { number: 'G1', seats: 2, isActive: true },
            { number: 'G2', seats: 4, isActive: true },
            { number: 'G3', seats: 4, isActive: true },
            { number: 'G4', seats: 6, isActive: true },
            { number: 'G5', seats: 8, isActive: true },
            { number: 'G6', seats: 4, isActive: true },
          ],
        },
      },
    });

    // Create First Floor (8 tables)
    await prisma.floor.create({
      data: {
        name: 'First Floor',
        tables: {
          create: [
            { number: 'F1', seats: 2, isActive: true },
            { number: 'F2', seats: 2, isActive: true },
            { number: 'F3', seats: 4, isActive: true },
            { number: 'F4', seats: 4, isActive: true },
            { number: 'F5', seats: 6, isActive: true },
            { number: 'F6', seats: 6, isActive: true },
            { number: 'F7', seats: 8, isActive: true },
            { number: 'F8', seats: 4, isActive: true },
          ],
        },
      },
    });

    // Create categories if they don't exist
    const categoriesCount = await prisma.category.count();
    if (categoriesCount === 0) {
      await prisma.category.createMany({
        data: [
          { id: 'cat-beverages', name: 'Beverages', color: '#3b82f6', order: 0 },
          { id: 'cat-food', name: 'Food', color: '#10b981', order: 1 },
          { id: 'cat-snacks', name: 'Snacks', color: '#f59e0b', order: 2 },
          { id: 'cat-desserts', name: 'Desserts', color: '#ec4899', order: 3 },
        ]
      });
    }

    // Upsert POS config
    await prisma.pOSConfig.upsert({
      where: { id: 'default-config' },
      update: {},
      create: {
        id: 'default-config',
        cashEnabled: true,
        digitalEnabled: true,
        upiEnabled: false,
      },
    });

    return NextResponse.json({ success: true, message: 'Database seeded successfully via API' });
  } catch (error: any) {
    console.error('Seed API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
