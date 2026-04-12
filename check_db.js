const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const floors = await prisma.floor.findMany({ include: { tables: true } });
  console.log('Floors:', JSON.stringify(floors, null, 2));
  
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories.length);
  
  const products = await prisma.product.findMany();
  console.log('Products:', products.length);

  const config = await prisma.pOSConfig.findFirst();
  console.log('POS Config:', config);

  await prisma.$disconnect();
}

check();
