/**
 * spread-orders-over-time.js
 * 
 * Redistributes existing orders over the past 12 months
 * so that monthly/weekly/yearly report periods show different data.
 * 
 * Distribution:
 * - ~40% of orders: within the last 30 days (shows in monthly/weekly/yearly)
 * - ~35% of orders: 1-6 months ago (shows only in yearly)
 * - ~25% of orders: 6-12 months ago (shows only in yearly)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomDateBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  const orders = await prisma.order.findMany({ select: { id: true, createdAt: true } });
  console.log(`Found ${orders.length} orders to redistribute`);

  const now = new Date();

  // Define time buckets
  const buckets = [
    // Recent: last 30 days — 40% of orders
    { from: new Date(now - 30 * 864e5),  to: now,                          weight: 0.40 },
    // Medium: 1–3 months ago — 30% of orders
    { from: new Date(now - 90 * 864e5),  to: new Date(now - 30 * 864e5),  weight: 0.30 },
    // Old: 3–6 months ago — 20% of orders
    { from: new Date(now - 180 * 864e5), to: new Date(now - 90 * 864e5),  weight: 0.20 },
    // Very old: 6–12 months ago — 10% of orders
    { from: new Date(now - 365 * 864e5), to: new Date(now - 180 * 864e5), weight: 0.10 },
  ];

  // Assign orders to buckets
  let bucketAssignments = [];
  let remaining = [...orders];
  
  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    const isLast = i === buckets.length - 1;
    const count = isLast ? remaining.length : Math.round(orders.length * bucket.weight);
    const assigned = remaining.splice(0, count);
    assigned.forEach(order => bucketAssignments.push({ order, bucket }));
  }

  console.log('📅 Date distribution:');
  buckets.forEach((b, i) => {
    const count = Math.round(orders.length * b.weight);
    const label = i === 0 ? 'Last 30 days (monthly)' : 
                  i === 1 ? '1-3 months ago' : 
                  i === 2 ? '3-6 months ago' : '6-12 months ago';
    console.log(`  ${label}: ~${count} orders`);
  });

  console.log('\n💾 Updating timestamps...');

  for (const { order, bucket } of bucketAssignments) {
    const newDate = randomDateBetween(bucket.from, bucket.to);
    // Also stagger updatedAt slightly after createdAt
    const updatedAt = new Date(newDate.getTime() + Math.random() * 3600000);
    
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        createdAt: newDate,
        updatedAt: updatedAt,
      }
    });
  }

  // Verify
  console.log('\n📊 Verification:');
  const periods = [
    { label: 'Today',   from: new Date(new Date().setHours(0,0,0,0)) },
    { label: 'Weekly',  from: new Date(now - 7 * 864e5) },
    { label: 'Monthly', from: new Date(now - 30 * 864e5) },
    { label: 'Yearly',  from: new Date(now - 365 * 864e5) },
  ];

  for (const p of periods) {
    const count = await prisma.order.count({ where: { status: 'PAID', createdAt: { gte: p.from } } });
    const revenue = await prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: p.from } }, _sum: { total: true } });
    console.log(`  ${p.label}: ${count} orders, ₹${(revenue._sum.total || 0).toFixed(0)} revenue`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Done! Refresh the Reports page to see period-specific data.');
}

main().catch(err => { console.error(err); process.exit(1); });
