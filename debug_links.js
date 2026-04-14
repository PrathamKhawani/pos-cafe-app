const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const branches = await prisma.branch.findMany({
    include: {
      floors: {
        include: {
          tables: true
        }
      }
    }
  });

  console.log('--- DATABASE SNAPSHOT ---');
  branches.forEach(b => {
    console.log(`Branch: ${b.name} (${b.id})`);
    console.log(`  Floors: ${b.floors.length}`);
    b.floors.forEach(f => {
      console.log(`    - Floor: ${f.name} (Tables: ${f.tables.length})`);
    });
  });
  console.log('-------------------------');
}

run().catch(console.error).finally(() => prisma.$disconnect());
