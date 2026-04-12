/**
 * backfill-branch-orders.js
 * 
 * Distributes existing orders (that have NULL branchId) across branches
 * using session → branch linkage first, then table → floor → branch,
 * and finally falling back to round-robin distribution.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching all data...');

  const [orders, branches, sessions] = await Promise.all([
    prisma.order.findMany({
      where: { branchId: null },
      include: {
        table: { include: { floor: { include: { branch: true } } } },
        session: { select: { branchId: true } },
      }
    }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
    prisma.session.findMany({ select: { id: true, branchId: true } }),
  ]);

  console.log(`Found ${orders.length} orders with NULL branchId`);
  console.log(`Found ${branches.length} branches`);

  const sessionBranchMap = new Map();
  sessions.forEach(s => { if (s.branchId) sessionBranchMap.set(s.id, s.branchId); });

  let fixed = 0, roundRobin = 0;
  const updates = [];

  orders.forEach((order, idx) => {
    let assignedBranchId = null;

    // Priority 1: session → branch
    if (order.sessionId && sessionBranchMap.has(order.sessionId)) {
      assignedBranchId = sessionBranchMap.get(order.sessionId);
      fixed++;
    }
    // Priority 2: table → floor → branch
    else if (order.table?.floor?.branch?.id) {
      assignedBranchId = order.table.floor.branch.id;
      fixed++;
    }
    // Priority 3: round-robin across branches
    else {
      assignedBranchId = branches[idx % branches.length].id;
      roundRobin++;
    }

    updates.push({ id: order.id, branchId: assignedBranchId });
  });

  console.log(`✅ Linked via session/table: ${fixed}`);
  console.log(`🔄 Round-robin assigned: ${roundRobin}`);

  // Batch update
  console.log('💾 Updating database...');
  for (const update of updates) {
    await prisma.order.update({ where: { id: update.id }, data: { branchId: update.branchId } });
  }

  // Verify
  const breakdown = await Promise.all(
    branches.map(async b => {
      const count = await prisma.order.count({ where: { branchId: b.id } });
      return { branch: b.name, orders: count };
    })
  );

  console.log('\n📊 Orders per branch after backfill:');
  breakdown.forEach(b => console.log(`  ${b.branch}: ${b.orders} orders`));

  await prisma.$disconnect();
  console.log('\n✅ Done! Refresh the Reports page to see per-branch data.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
