const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.pOSConfig.findFirst();
  console.log('Current POS Config:', config);
  
  if (config) {
    console.log('Enabling digital payment options...');
    const updated = await prisma.pOSConfig.update({
      where: { id: config.id },
      data: { 
        digitalEnabled: true,
        cashEnabled: true
      }
    });
    console.log('Updated POS Config:', updated);
  } else {
    console.log('No POS config found. Creating one with digital enabled...');
    const created = await prisma.pOSConfig.create({
      data: { digitalEnabled: true, cashEnabled: true }
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
