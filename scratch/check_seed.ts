import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const products = await prisma.product.findMany({ 
    take: 5,
    select: { name: true, category: { select: { name: true } }, isVegetarian: true }
  });
  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    readyOrders: await prisma.order.count({ where: { status: 'READY' } }),
  };
  console.log('Final Counts:', counts);
  console.log('Sample Products:', products);
  process.exit(0);
}
run();
