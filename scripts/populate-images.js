const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const images = {
    'Aglio E Olio': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    'Alfredo Fettuccine': 'https://images.unsplash.com/photo-1645112481338-341bc8786961?w=800&q=80',
    'Americano': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    'Avocado Shake': 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=800&q=80',
    'Avocado Toast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    'BBQ Bacon Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'BBQ Chicken Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'BLT Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
    'Cappuccino': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&q=80',
    'Latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
    'Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80'
  };

  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const product of products) {
    const match = Object.keys(images).find(name => 
      product.name.toLowerCase().includes(name.toLowerCase())
    );

    if (match) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: images[match] }
      });
      updatedCount++;
      console.log(`Updated ${product.name}`);
    }
  }

  console.log(`Finished! Updated ${updatedCount} products.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
