const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Find a cashier
  const cashier = await prisma.user.findFirst({ where: { role: 'CASHIER' } });
  if (cashier) {
    await prisma.user.update({
      where: { id: cashier.id },
      data: { password: hashedPassword, email: 'staff@example.com' }
    });
    console.log('Staff user updated: staff@example.com / password123');
  }

  // Find a kitchen user
  const kitchen = await prisma.user.findFirst({ where: { role: 'KITCHEN' } });
  if (kitchen) {
    await prisma.user.update({
      where: { id: kitchen.id },
      data: { password: hashedPassword, email: 'kitchen@example.com' }
    });
    console.log('Kitchen user updated: kitchen@example.com / password123');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
