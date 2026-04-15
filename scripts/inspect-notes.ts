import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      note: { contains: 'Customer:' }
    },
    select: { id: true, note: true }
  });
  console.log('Orders found with Customer in notes:', orders.length);
  orders.forEach(o => console.log(`Order ${o.id}: ${o.note}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
