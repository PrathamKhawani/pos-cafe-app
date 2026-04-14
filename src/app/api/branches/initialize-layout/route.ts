import { NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';


export async function POST(req: Request) {
  try {
    const { branchId } = await req.json();

    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    // 1. Check if floors already exist to avoid accidental data loss
    const existingFloorsCount = await prisma.floor.count({ where: { branchId } });
    if (existingFloorsCount > 0) {
      return NextResponse.json({ 
        error: 'Branch already has floors configured. Please delete them manually first to reset the layout.' 
      }, { status: 400 });
    }

    // 2. Generate Dynamic Layout
    const floorPool = [
      'Grand Ballroom', 'Sunlit Terrace', 'Vintage Loft', 'Mezzanine Bar', 
      'Library Lounge', 'Rooftop Garden', 'Secret Cellar', 'Main Atrium', 
      'Gallery Walk', 'Sky Deck', 'Cozy Corner'
    ];
    
    // Choose 1-3 random floors
    const floorCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...floorPool].sort(() => 0.5 - Math.random());
    const selectedFloors = shuffled.slice(0, floorCount);

    const tablesCreated = [];

    for (const floorName of selectedFloors) {
      const floor = await prisma.floor.create({
        data: {
          name: floorName,
          branchId: branchId,
        }
      });

      // 5-10 tables per floor
      const tableCount = Math.floor(Math.random() * 6) + 5;
      for (let i = 1; i <= tableCount; i++) {
        const prefix = floorName.split(' ').map(w => w[0]).join('').toUpperCase();
        const t = await prisma.table.create({
          data: {
            number: `${prefix}${i}`,
            seats: [2, 4, 4, 4, 6, 8][Math.floor(Math.random() * 6)],
            floorId: floor.id,
            isActive: true,
            tableType: ['Table', 'Booth', 'Bar', 'Table'][Math.floor(Math.random() * 4)],
          }
        });
        tablesCreated.push({ tableId: t.id });
      }
    }

    return NextResponse.json({ 
      success: true, 
      floors: floorCount, 
      tables: tablesCreated.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
