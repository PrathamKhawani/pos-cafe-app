import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dynamic floors and tables for all branches...');

  // Get all seating and mixed branches
  const branches = await prisma.branch.findMany({
    where: {
      type: { in: ['SEATING', 'MIXED'] }
    }
  });

  if (branches.length === 0) {
    console.log('No seating-capable branches found.');
    return;
  }

  // Delete all existing floors and tables to prevent duplicate IDs or collisions
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  console.log('Cleared existing floors and tables.');

  const floorNames = ['Ground Floor', 'First Floor', 'Rooftop', 'Patio', 'Main Dining Room', 'Mezzanine'];

  for (const branch of branches) {
    // Randomize 1 or 2 floors per branch
    const numFloors = Math.floor(Math.random() * 2) + 1;
    
    // Pick unique floor names
    const shuffledNames = floorNames.sort(() => 0.5 - Math.random());
    const selectedNames = shuffledNames.slice(0, numFloors);

    for (const [floorIndex, floorName] of selectedNames.entries()) {
      // Create the floor
      const floor = await prisma.floor.create({
        data: {
          name: floorName,
          branchId: branch.id,
        }
      });

      console.log(`Created floor "${floorName}" for branch "${branch.name}"`);

      // Randomize 7 or 9 tables per floor
      const numTables = Math.random() < 0.5 ? 7 : 9;

      const tablesData = [];
      const floorPrefix = floorIndex === 0 ? 'GF' : `F${floorIndex}`; // Just an arbitrary prefix

      for (let i = 1; i <= numTables; i++) {
        const tableNumber = `${floorPrefix}-${i}`;
        
        // Let's vary the seats a bit, mostly 4, sometimes 2 or 6
        const randSeat = Math.random();
        let seats = 4;
        if (randSeat < 0.2) seats = 2;       // 20% 2-seater
        else if (randSeat > 0.8) seats = 6;  // 20% 6-seater

        tablesData.push({
          floorId: floor.id,
          number: tableNumber,
          seats: seats,
          isActive: true
        });
      }

      await prisma.table.createMany({
        data: tablesData
      });

      console.log(`  -> Added ${numTables} tables to "${floorName}"`);
    }
  }

  // Also make sure digitalEnabled is true in POS config
  const config = await prisma.pOSConfig.findFirst();
  if (config) {
    await prisma.pOSConfig.update({
      where: { id: config.id },
      data: { digitalEnabled: true, cashEnabled: true }
    });
  } else {
    await prisma.pOSConfig.create({
      data: { digitalEnabled: true, cashEnabled: true }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
