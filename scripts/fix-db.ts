import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Enable self-ordering in POSConfig
  const config = await prisma.pOSConfig.findFirst();
  if (config) {
    if (!config.selfOrderEnabled) {
      await prisma.pOSConfig.update({
        where: { id: config.id },
        data: { selfOrderEnabled: true }
      });
      console.log('Enabled selfOrderEnabled in POSConfig');
    } else {
      console.log('selfOrderEnabled is already true');
    }
  } else {
    await prisma.pOSConfig.create({
      data: { selfOrderEnabled: true }
    });
    console.log('Created POSConfig with selfOrderEnabled = true');
  }

  // 2. Fix Duplicate Tables / QR Tokens
  // Find all tables and group by floorId + number
  const tables = await prisma.table.findMany({
    include: { qrTokens: true, floor: true }
  });
  console.log(`Found ${tables.length} total tables.`);
  
  const seen = new Map();
  const duplicateTables = [];
  
  for (const table of tables) {
    const key = `${table.floorId}-${table.number}`;
    if (seen.has(key)) {
       duplicateTables.push(table);
    } else {
       seen.set(key, table);
    }
  }
  
  console.log(`Found ${duplicateTables.length} duplicate tables by (floorId, number) combination.`);
  
  // Actually delete the duplicate tables to solve "2 QR codes per table" issue if they are truly duplicated tables
  if (duplicateTables.length > 0) {
    for (const dup of duplicateTables) {
      await prisma.table.delete({ where: { id: dup.id } });
      console.log(`Deleted duplicate table ${dup.number} on floor ${dup.floor?.name}`);
    }
  }
  
  // Ensure tables don't have multiple QR tokens attached (rare but possible)
  for (const table of seen.values()) {
    if (table.qrTokens.length > 1) {
      console.log(`Table ${table.number} has ${table.qrTokens.length} QR tokens!`);
      // Delete all but the first token
      const tokensToDelete = table.qrTokens.slice(1);
      for (const t of tokensToDelete) {
         await prisma.qRToken.delete({ where: { id: t.id } });
         console.log(`Deleted extra QR token for table ${table.number}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
