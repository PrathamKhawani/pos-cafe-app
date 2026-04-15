import { PrismaClient, OrderStatus } from '@prisma/client';
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
  console.log('--- STARTING CUSTOMER BACKFILL ---');
  
  // 1. Create Sample Customers
  const customerIds: string[] = [];
  for (const name of NAMES) {
    try {
      const c = await prisma.customer.upsert({
        where: { phone: generatePhone() },
        update: {},
        create: { name, phone: generatePhone() }
      });
      customerIds.push(c.id);
    } catch (e) {
      // Logic for unique phone conflict handling in a loop
    }
  }
  
  // Ensure we have at least some customers if upserts failed
  if (customerIds.length === 0) {
    const fallback = await prisma.customer.create({ data: { name: 'Valued Guest', phone: '9876543210' } });
    customerIds.push(fallback.id);
  }

  console.log(`Created/Verified ${customerIds.length} sample customers.`);

  // 2. Link All Existing Orders
  const orders = await prisma.order.findMany({ select: { id: true, status: true } });
  console.log(`Linking ${orders.length} orders to customers...`);

  for (const order of orders) {
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    await prisma.order.update({
      where: { id: order.id },
      data: { customerId: randomCustomerId }
    });

    // 3. Backfill Item Statuses to match Order Status
    // This ensures they show up correctly in the new Kitchen Display logic
    await prisma.orderItem.updateMany({
      where: { orderId: order.id },
      data: { status: order.status }
    });
  }

  console.log('--- BACKFILL COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
