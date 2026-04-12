const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const withBranch = await prisma.order.count({ where: { branchId: { not: null } } });
  const withoutBranch = await prisma.order.count({ where: { branchId: null } });
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });

  console.log('Orders WITH branchId:', withBranch);
  console.log('Orders WITHOUT branchId (NULL):', withoutBranch);
  console.log('Branches:', JSON.stringify(branches, null, 2));

  await prisma.$disconnect();
}
main().catch(console.error);
