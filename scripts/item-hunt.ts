import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- ORDER ITEM SEARCH ---');
  const itemsWithNotes = await prisma.orderItem.findMany({
    where: { note: { not: null, not: '' } },
    select: { id: true, note: true, orderId: true }
  });
  console.log(`OrderItems with notes: ${itemsWithNotes.length}`);
  itemsWithNotes.forEach(it => console.log(`[Order ${it.orderId}] Item note: "${it.note}"`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
