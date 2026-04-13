const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.pOSConfig.findFirst();
  console.log('Current POS Config:', config);
  
  if (config && !config.onlineEnabled) {
    console.log('Online payments are disabled. Enabling them...');
    const updated = await prisma.pOSConfig.update({
      where: { id: config.id },
      data: { onlineEnabled: true }
    });
    console.log('Updated POS Config:', updated);
  } else if (!config) {
    console.log('No POS config found. Creating one with online enabled...');
    const created = await prisma.pOSConfig.create({
      data: { onlineEnabled: true, cashEnabled: true }
    });
    console.log('Created POS Config:', created);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
