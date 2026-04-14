const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting branch migration (MIXED -> SEATING)...');
  
  try {
    const updated = await prisma.branch.updateMany({
      where: { type: 'MIXED' },
      data: { type: 'SEATING' }
    });
    
    console.log(`Successfully migrated ${updated.count} branches.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
