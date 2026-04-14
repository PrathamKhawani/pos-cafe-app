const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING TOTAL RESTORATION ---');
  
  // 1. Get all branches
  const branches = await prisma.branch.findMany();
  console.log(`Found ${branches.length} branches to populate.`);

  for (const branch of branches) {
    console.log(`Processing branch: ${branch.name}...`);
    
    // Clear existing for this branch (just in case)
    await prisma.table.deleteMany({
      where: { floor: { branchId: branch.id } }
    });
    await prisma.floor.deleteMany({
      where: { branchId: branch.id }
    });

    // Create Ground Floor
    await prisma.floor.create({
      data: {
        name: 'Ground Floor',
        branchId: branch.id,
        tables: {
          create: [
            { number: 'G1', seats: 2 },
            { number: 'G2', seats: 4 },
            { number: 'G3', seats: 4 },
            { number: 'G4', seats: 6 },
            { number: 'G5', seats: 8 },
            { number: 'G6', seats: 4 },
          ]
        }
      }
    });

    // Create First Floor
    await prisma.floor.create({
      data: {
        name: 'First Floor',
        branchId: branch.id,
        tables: {
          create: [
            { number: 'F1', seats: 2 },
            { number: 'F2', seats: 2 },
            { number: 'F3', seats: 4 },
            { number: 'F4', seats: 4 },
            { number: 'F5', seats: 6 },
            { number: 'F6', seats: 6 },
            { number: 'F7', seats: 8 },
            { number: 'F8', seats: 4 },
          ]
        }
      }
    });
    
    console.log(`Successfully populated ${branch.name}`);
  }

  console.log('--- RESTORATION COMPLETE ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
