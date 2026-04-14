import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching existing records...');

  const branches = await prisma.branch.findMany();
  const products = await prisma.product.findMany({ take: 30 });
  const users = await prisma.user.findMany({ where: { role: 'ADMIN' }, take: 1 });

  if (!branches.length || !products.length || !users.length) {
    console.error('❌ No branches, products, or users found!');
    process.exit(1);
  }

  const user = users[0];
  console.log(`✅ Found: ${branches.length} branches, ${products.length} products`);
  console.log(`✅ Using user: ${user.name} (${user.role})`);
  console.log(`✅ Seeding branches: ${branches.map(b => b.name).join(', ')}\n`);

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const paymentMethods: ('CASH' | 'DIGITAL' | 'UPI')[] = ['CASH', 'DIGITAL', 'UPI'];

  const daysAgo = (days: number, hourOffset = 10): Date => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hourOffset + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
    return d;
  };

  // Date plan: each branch gets orders for all time periods
  // Days back => count of orders for that day-slot
  const datePlan: { daysBack: number; hourStart: number; count: number }[] = [
    // TODAY (5 orders, morning + lunch + dinner)
    { daysBack: 0, hourStart: 8, count: 2 },
    { daysBack: 0, hourStart: 12, count: 2 },
    { daysBack: 0, hourStart: 19, count: 2 },
    // YESTERDAY
    { daysBack: 1, hourStart: 9, count: 3 },
    { daysBack: 1, hourStart: 20, count: 2 },
    // LAST 7 DAYS (this week)
    ...Array.from({ length: 5 }, (_, i) => ({ daysBack: i + 2, hourStart: 11, count: 4 })),
    // LAST 30 DAYS (this month)
    ...Array.from({ length: 20 }, (_, i) => ({ daysBack: i + 8, hourStart: 13, count: 3 })),
    // OLDER MONTHS (yearly data — spread across 11 months back)
    ...Array.from({ length: 11 }, (_, i) => [
      { daysBack: 30 + (i * 28), hourStart: 10, count: 5 },
      { daysBack: 30 + (i * 28) + 7, hourStart: 14, count: 4 },
      { daysBack: 30 + (i * 28) + 14, hourStart: 18, count: 3 },
    ]).flat(),
  ];

  let totalCreated = 0;

  for (const branch of branches) {
    console.log(`\n🏪 Seeding branch: ${branch.name}...`);
    let branchCreated = 0;

    for (const spec of datePlan) {
      for (let c = 0; c < spec.count; c++) {
        const orderDate = daysAgo(spec.daysBack, spec.hourStart);

        // Pick 1-4 random products
        const numItems = Math.floor(Math.random() * 4) + 1;
        const chosenProducts = Array.from({ length: numItems }, () => pick(products));

        const items = chosenProducts.map(p => ({
          productId: p.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: p.price,
        }));
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        try {
          await prisma.order.create({
            data: {
              status: 'PAID',
              total,
              branchId: branch.id,
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
          branchCreated++;
          totalCreated++;
        } catch (e: any) {
          console.warn(`  ⚠️  Skipped: ${e.message?.slice(0, 80)}`);
        }
      }
    }

    console.log(`  ✅ ${branchCreated} orders created for ${branch.name}`);
  }

  console.log(`\n🎉 Done! Created ${totalCreated} orders across ${branches.length} branches.`);
  console.log('📊 Reports now have full Daily, Weekly, Monthly, and Yearly data per branch.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
