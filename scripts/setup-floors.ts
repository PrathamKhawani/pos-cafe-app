
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting floors and tables...');
  
  // 1. Clear existing floors and tables
  await prisma.table.deleteMany({});
  await prisma.floor.deleteMany({});

  // 2. Create Ground Floor (6 tables)
  await prisma.floor.create({
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
  await prisma.floor.create({
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

  console.log('Floor plan reset successful!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
