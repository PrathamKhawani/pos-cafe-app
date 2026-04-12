const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('Deleting sessions...');
    await prisma.session.deleteMany();
    
    console.log('Update orders to remove user references...');
    await prisma.order.updateMany({
      data: { userId: null }
    });
    
    console.log('Deleting users...');
    const result = await prisma.user.deleteMany();
    
    console.log(`Successfully deleted ${result.count} users.`);
  } catch (error) {
    console.error('Error resetting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();
