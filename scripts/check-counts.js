const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const floors = await prisma.floor.count();
  const tables = await prisma.table.count();
  console.log(`DB has ${floors} floors, ${tables} tables`);
  await prisma.$disconnect();
}

test().catch(e => console.error(e));
