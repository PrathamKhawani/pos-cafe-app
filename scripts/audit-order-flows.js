/**
 * audit-order-flows.js
 * Full audit of: POS orders, QR self-orders, payment records, branch linkage,
 * and reports API correctness.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function main() {
  section('1. Branch Summary');
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  console.log(`Total branches: ${branches.length}`);
  branches.forEach(b => console.log(`  • ${b.name} (${b.id})`));

  section('2. Order Counts by Source & Branch');
  const allOrders = await prisma.order.findMany({
    select: { id: true, status: true, branchId: true, isQrOrder: true, total: true, createdAt: true }
  });

  const withBranch = allOrders.filter(o => o.branchId);
  const nullBranch = allOrders.filter(o => !o.branchId);
  const posOrders = allOrders.filter(o => !o.isQrOrder);
  const qrOrders = allOrders.filter(o => o.isQrOrder);
  const paidOrders = allOrders.filter(o => o.status === 'PAID');

  console.log(`Total orders: ${allOrders.length}`);
  console.log(`  ✅ With branchId: ${withBranch.length}`);
  console.log(`  ❌ NULL branchId: ${nullBranch.length}`);
  console.log(`  POS orders: ${posOrders.length}`);
  console.log(`  QR self-orders: ${qrOrders.length}`);
  console.log(`  PAID orders: ${paidOrders.length}`);

  section('3. Orders Per Branch (all statuses)');
  for (const b of branches) {
    const count = allOrders.filter(o => o.branchId === b.id).length;
    const revenue = allOrders.filter(o => o.branchId === b.id && o.status === 'PAID').reduce((s, o) => s + o.total, 0);
    console.log(`  ${b.name}: ${count} orders | PAID revenue: ₹${revenue.toFixed(0)}`);
  }

  section('4. Payment Records Audit');
  const payments = await prisma.payment.findMany({
    include: { order: { select: { branchId: true, status: true } } }
  });
  const ordersWithPayment = allOrders.filter(o => o.status === 'PAID');
  const paymentsWithBranch = payments.filter(p => p.order?.branchId);
  const paymentsNullBranch = payments.filter(p => !p.order?.branchId);

  console.log(`Total payment records: ${payments.length}`);
  console.log(`  ✅ Payment records with branchId: ${paymentsWithBranch.length}`);
  console.log(`  ❌ Payment records missing branchId on order: ${paymentsNullBranch.length}`);
  console.log(`  PAID orders without payment record: ${ordersWithPayment.length - payments.length}`);

  section('5. Payment Method Breakdown');
  const methodGroups = {};
  payments.forEach(p => { methodGroups[p.method] = (methodGroups[p.method] || 0) + 1; });
  Object.entries(methodGroups).forEach(([m, c]) => console.log(`  ${m}: ${c} payments`));

  section('6. Self-Order (QR) Branch Linkage');
  const qrWithBranch = qrOrders.filter(o => o.branchId).length;
  const qrNoBranch = qrOrders.filter(o => !o.branchId).length;
  console.log(`QR orders with branchId: ${qrWithBranch}`);
  console.log(`QR orders without branchId: ${qrNoBranch}`);
  if (qrNoBranch > 0) {
    console.log('  ⚠️  These QR orders will NOT appear in per-branch reports!');
    console.log('  → Possible cause: QR token table has no floor/branch linked.');
  }

  section('7. Reports API Simulation (All Branches, Monthly)');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyPaid = allOrders.filter(o => o.status === 'PAID' && new Date(o.createdAt) >= thirtyDaysAgo);
  const totalRevMonthly = monthlyPaid.reduce((s, o) => s + o.total, 0);
  console.log(`Monthly PAID orders: ${monthlyPaid.length}`);
  console.log(`Monthly total revenue: ₹${totalRevMonthly.toFixed(0)}`);
  
  console.log('\nPer-branch monthly PAID:');
  for (const b of branches) {
    const bOrders = monthlyPaid.filter(o => o.branchId === b.id);
    const bRev = bOrders.reduce((s, o) => s + o.total, 0);
    if (bOrders.length > 0 || bRev > 0) {
      console.log(`  ${b.name}: ${bOrders.length} orders, ₹${bRev.toFixed(0)}`);
    }
  }
  const branchSum = branches.reduce((s, b) => {
    return s + monthlyPaid.filter(o => o.branchId === b.id).reduce((bs, o) => bs + o.total, 0);
  }, 0);
  const nullBranchMonthly = monthlyPaid.filter(o => !o.branchId);
  console.log(`\n  ✅ Branch sum: ₹${branchSum.toFixed(0)}`);
  console.log(`  ✅ All-branch total: ₹${totalRevMonthly.toFixed(0)}`);
  if (Math.abs(branchSum - totalRevMonthly) < 1) {
    console.log('  ✅ MATCH: All-branch total = sum of individual branches');
  } else {
    console.log(`  ❌ MISMATCH: ${nullBranchMonthly.length} orders (₹${nullBranchMonthly.reduce((s,o)=>s+o.total,0).toFixed(0)}) have NULL branchId and are excluded from per-branch totals`);
  }

  section('8. Recommendations');

  const issues = [];
  if (nullBranch.length > 0) issues.push(`${nullBranch.length} orders have NULL branchId — run the backfill script`);
  if (paymentsNullBranch.length > 0) issues.push(`${paymentsNullBranch.length} payment records are on orders with no branchId`);
  if (qrNoBranch > 0) issues.push(`${qrNoBranch} QR self-orders are unlinked — check Table→Floor→Branch setup`);
  const paidNoPayment = ordersWithPayment.length - payments.length;
  if (paidNoPayment > 0) issues.push(`${paidNoPayment} PAID orders have no Payment record — won't appear in Payment Mix chart`);

  if (issues.length === 0) {
    console.log('  ✅ All checks passed! Reports should be accurate.');
  } else {
    issues.forEach(i => console.log(`  ⚠️  ${i}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
