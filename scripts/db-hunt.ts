import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE INSPECTION ---');
  
  // 1. Check existing customers
  const customerCount = await prisma.customer.count();
  console.log(`Total Customers in DB: ${customerCount}`);
  
  // 2. Check orders with notes
  const ordersWithNotes = await prisma.order.findMany({
    where: { note: { not: null, not: '' } },
    select: { id: true, note: true }
  });
  console.log(`Orders with notes: ${ordersWithNotes.length}`);
  
  // 3. Regular expression for name/phone patterns
  // Pattern: "Name: ... Phone: ..." or "Customer: ... | ..."
  const phoneRegex = /\b\d{10}\b/; // Simple 10-digit number
  
  const findings: any[] = [];
  ordersWithNotes.forEach(o => {
    if (o.note && (o.note.includes('Customer') || o.note.includes('Phone') || phoneRegex.test(o.note))) {
      findings.push({ orderId: o.id, note: o.note });
    }
  });
  
  console.log(`Orders matching migration patterns: ${findings.length}`);
  findings.forEach(f => console.log(`[Order ${f.orderId}] -> ${f.note}`));
  
  // 4. Check Payment table (sometimes people put user info in payment notes)
  const payments = await prisma.payment.findMany({
    where: { 
       // Check if there are any metadata fields if they exist
    },
    take: 10
  });
  console.log(`Recent payments inspected: ${payments.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
