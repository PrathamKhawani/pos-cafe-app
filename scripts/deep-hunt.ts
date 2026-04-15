import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DEEP DATABASE HUNT ---');
  
  // 1. All Users (checking for non-staff roles)
  const users = await prisma.user.findMany({ select: { id: true, name: true, phone: true, role: true } });
  console.log('Users found:', users.length);
  users.forEach(u => console.log(`User: ${u.name} | Phone: ${u.phone} | Role: ${u.role}`));

  // 2. All Orders with ANY data in note
  const orders = await prisma.order.findMany({ select: { id: true, note: true, total: true } });
  console.log('Total Orders:', orders.length);
  const activeNotes = orders.filter(o => o.note && o.note.trim() !== '');
  console.log('Orders with usable notes:', activeNotes.length);
  activeNotes.forEach(o => console.log(`Order ${o.id}: "${o.note}"`));

  // 3. Category/Product names? (sometimes people use products as 'Guest Name'?)
  // Probably not.
}

main().catch(console.error).finally(() => prisma.$disconnect());
