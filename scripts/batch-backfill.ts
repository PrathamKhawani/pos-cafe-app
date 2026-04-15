import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NAMES = [
  'Aayush Sharma', 'Aditi Verma', 'Akash Gupta', 'Ananya Iyer', 'Arjun Malhotra',
  'Deepak Rao', 'Divya Nair', 'Ishaan Khattar', 'Kavya Soni', 'Manish Pandey',
  'Nandini Reddy', 'Pranav Joshi', 'Priyanka Bose', 'Rahul Deshmukh', 'Riya Sen',
  'Sandeep Kulkarni', 'Sneha Patil', 'Varun Bajaj', 'Yash Singhania', 'Zoya Khan'
];

function generatePhone() {
  return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

async function main() {
  console.log('--- STARTING ROBUST BATCH BACKFILL ---');
  
  // 1. Create Sample Customers
  const customerIds: string[] = [];
  for (let i = 0; i < 30; i++) {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const phone = generatePhone();
    try {
      const c = await prisma.customer.create({ data: { name, phone } });
      customerIds.push(c.id);
    } catch (e) {
      // Ignore duplicates
    }
  }
  
  if (customerIds.length === 0) {
    const existing = await prisma.customer.findMany({ take: 30 });
    existing.forEach(c => customerIds.push(c.id));
  }

  console.log(`Using ${customerIds.length} customers for backfill.`);

  // 2. Fetch all orders
  const orders = await prisma.order.findMany({ select: { id: true, status: true } });
  console.log(`Total orders to process: ${orders.length}`);

  // 3. Process in small batches of 20 to avoid timeouts
  const BATCH_SIZE = 20;
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(orders.length/BATCH_SIZE)}...`);
    
    await Promise.all(batch.map(async (order) => {
      const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      
      // Update order
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: randomCustomerId }
      });

      // Update items
      await prisma.orderItem.updateMany({
        where: { orderId: order.id },
        data: { 
          status: order.status,
          isPrepared: order.status === 'READY' || order.status === 'DELIVERED'
        }
      });
    }));
  }

  console.log('--- BATCH BACKFILL COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
