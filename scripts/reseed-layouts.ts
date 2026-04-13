import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Required for terminal/Node environments to use WebSockets with Neon
neonConfig.webSocketConstructor = ws;

const dbUrl = process.env.DATABASE_URL || '';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting dynamic layout population (Serverless Mode)...');
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in environment!');
    return;
  }

  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 Connecting via HTTPS/WebSockets to: ${maskedUrl}`);

  // Initialize Neon Adapter
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const branches = await prisma.branch.findMany();
    console.log(`Found ${branches.length} branches.`);

    for (const branch of branches) {
      console.log(`\n🏗️  Processing branch: ${branch.name} (${branch.id})`);

      // 1. Check if floors already exist to avoid data loss
      const existingFloorCount = await prisma.floor.count({ where: { branchId: branch.id } });
      if (existingFloorCount > 0) {
        console.log(`   - Skipping branch ${branch.name} (already has ${existingFloorCount} floors). Use --force if you want to reset.`);
        continue;
      }

      console.log(`   - Populating new layout for branch...`);

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
    await pool.end();
  }
}

main();
