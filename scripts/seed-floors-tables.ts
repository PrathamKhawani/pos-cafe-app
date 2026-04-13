import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const dbUrl = process.env.DATABASE_URL || '';

async function main() {
  console.log('🚀 Initializing premium branch layouts...');
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing!');
    return;
  }

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const branches = await prisma.branch.findMany();
    
    for (const branch of branches) {
      const existing = await prisma.floor.count({ where: { branchId: branch.id } });
      if (existing > 0) {
        console.log(`✅ Branch ${branch.name} already has a layout. Skipping.`);
        continue;
      }

      console.log(`🏗️  Designing layout for ${branch.name}...`);

      const layouts = [
        {
          floor: 'Main Hall',
          prefix: 'H',
          tables: [
            { n: '1', s: 4, t: 'Booth' }, { n: '2', s: 4, t: 'Booth' },
            { n: '3', s: 2, t: 'Table' }, { n: '4', s: 2, t: 'Table' },
            { n: '5', s: 6, t: 'Round' }, { n: '6', s: 4, t: 'Table' }
          ]
        },
        {
          floor: 'Rooftop Bar',
          prefix: 'R',
          tables: [
            { n: '1', s: 2, t: 'Bar' }, { n: '2', s: 2, t: 'Bar' },
            { n: '3', s: 4, t: 'Lounge' }, { n: '4', s: 6, t: 'Lounge' }
          ]
        },
        {
          floor: 'Private Cabanas',
          prefix: 'P',
          tables: [
            { n: '1', s: 8, t: 'Private' }, { n: '2', s: 8, t: 'Private' }
          ]
        }
      ];

      for (const layout of layouts) {
        const floor = await prisma.floor.create({
          data: { name: layout.floor, branchId: branch.id }
        });

        for (const t of layout.tables) {
          await prisma.table.create({
            data: {
              floorId: floor.id,
              number: `${layout.prefix}${t.n}`,
              seats: t.s,
              tableType: t.t,
              isActive: true
            }
          });
        }
      }
      console.log(`✨ Branch ${branch.name} setup completed with 3 floors.`);
    }

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
