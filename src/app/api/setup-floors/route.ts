
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Clear existing floors and tables
    await prisma.table.deleteMany({});
    await prisma.floor.deleteMany({});

    // 2. Create Ground Floor (6 tables)
    const groundFloor = await prisma.floor.create({
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

    // 3. Create First Floor (8 tables)
    const firstFloor = await prisma.floor.create({
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

    return NextResponse.json({ 
      message: 'Floor plan reset successful!', 
      floors: [groundFloor, firstFloor] 
    });
  } catch (error: any) {
    console.error('Setup failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
