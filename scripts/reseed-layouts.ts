import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting dynamic layout population for all branches...');

  try {
    const branches = await prisma.branch.findMany();
    console.log(`Found ${branches.length} branches.`);

    for (const branch of branches) {
      console.log(`\n🏗️  Processing branch: ${branch.name} (${branch.id})`);

      // 1. Clean existing floors/tables
      const deletedFloors = await prisma.floor.deleteMany({ where: { branchId: branch.id } });
      console.log(`   - Cleaned up ${deletedFloors.count} existing floors.`);

      // 2. Generate Dynamic Layout
      const floorPool = [
        'Grand Ballroom', 'Sunlit Terrace', 'Vintage Loft', 'Mezzanine Bar', 
        'Library Lounge', 'Rooftop Garden', 'Secret Cellar', 'Main Atrium', 
        'Gallery Walk', 'Sky Deck', 'Cozy Corner', 'Garden Terrace', 'Main Hall'
      ];
      
      const floorCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...floorPool].sort(() => 0.5 - Math.random());
      const selectedFloors = shuffled.slice(0, floorCount);

      let totalTables = 0;

      for (const floorName of selectedFloors) {
        const floor = await prisma.floor.create({
          data: {
            name: floorName,
            branchId: branch.id,
          }
        });

        const tableCount = Math.floor(Math.random() * 6) + 5;
        for (let i = 1; i <= tableCount; i++) {
          const prefix = floorName.split(' ').map(w => w[0]).join('').toUpperCase();
          await prisma.table.create({
            data: {
              number: `${prefix}${i}`,
              seats: [2, 4, 4, 4, 6, 8][Math.floor(Math.random() * 6)],
              floorId: floor.id,
              isActive: true,
              tableType: ['Table', 'Booth', 'Bar', 'Table'][Math.floor(Math.random() * 4)],
            }
          });
          totalTables++;
        }
      }

      console.log(`   - Created ${floorCount} floors and ${totalTables} tables.`);
    }

    console.log('\n✅ Population complete!');
  } catch (error: any) {
    console.error('\n❌ Error during population:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
