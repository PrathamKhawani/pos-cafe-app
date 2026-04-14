import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching existing records...');

  const branches = await prisma.branch.findMany({ take: 5 });
  const categories = await prisma.category.findMany({ take: 10 });
  const products = await prisma.product.findMany({ take: 30 });
  const users = await prisma.user.findMany({ where: { role: 'ADMIN' }, take: 1 });

  if (!branches.length || !products.length || !users.length) {
    console.error('❌ No branches, products, or users found! Please seed base data first.');
    process.exit(1);
  }

  const user = users[0];
  const branch = branches[0];
  const branchIds = branches.map(b => b.id);

  console.log(`✅ Found: ${branches.length} branches, ${categories.length} categories, ${products.length} products`);
  console.log(`✅ Using user: ${user.name} (${user.role})`);

  // Helper to get a date offset from now
  const daysAgo = (days: number, hourOffset = 0): Date => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hourOffset + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
    return d;
  };

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const paymentMethods: ('CASH' | 'DIGITAL' | 'UPI')[] = ['CASH', 'DIGITAL', 'UPI'];

  // Build a seed plan: 
  // TODAY: 8 orders across branches (morning and evening rush)
  // THIS WEEK (last 7d): 5 orders per day
  // THIS MONTH (last 30d): 4 orders per day
  // THIS YEAR (last 365d): 2 orders per day for older dates

  type OrderSpec = { daysBack: number; hourStart: number; count: number };
  const plan: OrderSpec[] = [
    // Today's orders (morning + afternoon + evening rush)
    ...Array.from({ length: 10 }, (_, i) => ({ daysBack: 0, hourStart: 8 + i, count: 1 })),
    // Yesterday
    ...Array.from({ length: 8 }, () => ({ daysBack: 1, hourStart: 10, count: 1 })),
    // 2-6 days ago (this week)
    ...Array.from({ length: 5 }, (_, i) => ({ daysBack: i + 2, hourStart: 9, count: 6 })),
    // 7-29 days ago (this month older)
    ...Array.from({ length: 22 }, (_, i) => ({ daysBack: i + 7, hourStart: 11, count: 4 })),
    // 30-364 days ago (this year older)
    ...Array.from({ length: 30 }, (_, i) => ({ daysBack: 15 + (i * 11), hourStart: 12, count: 3 })),
  ];

  let created = 0;

  for (const spec of plan) {
    for (let c = 0; c < spec.count; c++) {
      const orderDate = daysAgo(spec.daysBack, spec.hourStart);
      const thisBranch = pick(branchIds);

      // Pick 1-4 random products
      const numItems = Math.floor(Math.random() * 4) + 1;
      const chosenProducts: typeof products = [];
      for (let i = 0; i < numItems; i++) {
        chosenProducts.push(pick(products));
      }

      // Calculate total
      const items = chosenProducts.map(p => ({
        productId: p.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: p.price,
      }));
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      try {
        const order = await prisma.order.create({
          data: {
            status: 'PAID',
            total,
            branchId: thisBranch,
            userId: user.id,
            createdAt: orderDate,
            updatedAt: orderDate,
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                isPrepared: true,
              }))
            },
            payment: {
              create: {
                method: pick(paymentMethods),
                amount: total,
                paidAt: orderDate,
              }
            }
          }
        });
        created++;
        if (created % 20 === 0) console.log(`  ...${created} orders created`);
      } catch (e: any) {
        console.warn(`⚠️ Skipped one order: ${e.message?.slice(0, 80)}`);
      }
    }
  }

  console.log(`\n✅ Done! Created ${created} seeded orders for reports.`);
  console.log('📊 Your reports should now show data for Daily, Weekly, Monthly, and Yearly filters.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
