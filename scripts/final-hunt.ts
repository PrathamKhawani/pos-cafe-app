import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- FINAL DATABASE HUNT ---');
  
  // 1. All Users (checking roles and names)
  const users = await prisma.user.findMany({ 
    select: { id: true, name: true, role: true } 
  });
  console.log('Total Users:', users.length);
  users.forEach(u => console.log(`User: ${u.name} | Role: ${u.role}`));

  // 2. All Orders
  const orders = await prisma.order.findMany({
    select: { id: true, note: true, total: true, isQrOrder: true }
  });
  console.log('Total Orders in system:', orders.length);
  const activeNotes = orders.filter(o => o.note && o.note.trim() !== '');
  console.log('Orders with any note content:', activeNotes.length);
  activeNotes.forEach(o => console.log(`[Order ${o.id}] (QR:${o.isQrOrder}): "${o.note}"`));

  // 3. Count customers
  const customers = await prisma.customer.count();
  console.log('Total Customers currently in database:', customers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
