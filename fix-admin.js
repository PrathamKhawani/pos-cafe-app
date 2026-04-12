const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { isApproved: true }
  });
  console.log('Fixed ADMIN approval status.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
