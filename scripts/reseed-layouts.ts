import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting dynamic layout population for all branches...');
  
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 Connecting to: ${maskedUrl}`);

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in environment!');
    return;
  }

  // Connection Retry Logic for Neon "Cold Starts"
  let connected = false;
  let retries = 5;
  
  while (retries > 0 && !connected) {
    try {
      console.log(`⏳ Attempting to connect... (${retries} retries left)`);
      await prisma.$connect();
      connected = true;
      console.log('✅ Connected to database successfully!');
    } catch (err: any) {
      console.warn(`⚠️  Connection failed: ${err.message}`);
      retries--;
      if (retries > 0) {
        console.log('💤 Waiting 3 seconds before next attempt...');
        await delay(3000);
      } else {
        console.error('❌ Failed to connect to database after multiple attempts.');
        process.exit(1);
      }
    }
  }

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
