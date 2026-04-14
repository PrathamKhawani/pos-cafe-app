const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    const deleteOrderItems = await prisma.orderItem.deleteMany();
    console.log(`Deleted ${deleteOrderItems.count} order items.`);
    
    const deletePayments = await prisma.payment.deleteMany();
    console.log(`Deleted ${deletePayments.count} payments.`);
    
    const deleteOrders = await prisma.order.deleteMany();
    console.log(`Deleted ${deleteOrders.count} orders.`);
    
    console.log('Database cleanup completed successfully.');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
