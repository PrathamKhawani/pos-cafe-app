/**
 * seed-floors-tables.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Wipes ALL existing floors + tables, then seeds FIXED (deterministic)
 * branch-specific layouts for every SEATING / MIXED branch.
 *
 * Run:
 *   npx ts-node -e "require('./scripts/seed-floors-tables.ts')"
 *   OR
 *   npx tsx scripts/seed-floors-tables.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH LAYOUT DEFINITIONS
// Each entry maps a branch NAME → its specific floors + tables.
// Table number   : short, readable code (Floor prefix + number)
// tableType      : 'Table' | 'Booth' | 'Bar'
// seats          : number of seats at that table
// ─────────────────────────────────────────────────────────────────────────────
interface TableDef {
  number: string;
  seats: number;
  tableType: 'Table' | 'Booth' | 'Bar';
}
interface FloorDef {
  name: string;
  tables: TableDef[];
}
interface BranchLayout {
  branchName: string;
  floors: FloorDef[];
}

const BRANCH_LAYOUTS: BranchLayout[] = [
  // ── 1. Downtown Cafe (SEATING) ───────────────────────────────────────────
  {
    branchName: 'Downtown Cafe',
    floors: [
      {
        name: 'Ground Floor',
        tables: [
          { number: 'GF-01', seats: 2, tableType: 'Table' },
          { number: 'GF-02', seats: 2, tableType: 'Table' },
          { number: 'GF-03', seats: 4, tableType: 'Table' },
          { number: 'GF-04', seats: 4, tableType: 'Table' },
          { number: 'GF-05', seats: 4, tableType: 'Table' },
          { number: 'GF-B1', seats: 4, tableType: 'Booth' },
          { number: 'GF-B2', seats: 4, tableType: 'Booth' },
          { number: 'GF-06', seats: 6, tableType: 'Table' },
        ],
      },
      {
        name: 'Outdoor Patio',
        tables: [
          { number: 'PT-01', seats: 2, tableType: 'Table' },
          { number: 'PT-02', seats: 2, tableType: 'Table' },
          { number: 'PT-03', seats: 4, tableType: 'Table' },
          { number: 'PT-04', seats: 4, tableType: 'Table' },
          { number: 'PT-05', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },

  // ── 2. Harbor Bistro (SEATING) ───────────────────────────────────────────
  {
    branchName: 'Harbor Bistro',
    floors: [
      {
        name: 'Main Dining Room',
        tables: [
          { number: 'MD-01', seats: 2, tableType: 'Table' },
          { number: 'MD-02', seats: 2, tableType: 'Table' },
          { number: 'MD-03', seats: 4, tableType: 'Table' },
          { number: 'MD-04', seats: 4, tableType: 'Table' },
          { number: 'MD-05', seats: 4, tableType: 'Table' },
          { number: 'MD-06', seats: 4, tableType: 'Table' },
          { number: 'MD-B1', seats: 6, tableType: 'Booth' },
          { number: 'MD-B2', seats: 6, tableType: 'Booth' },
          { number: 'MD-07', seats: 8, tableType: 'Table' },
          { number: 'MD-08', seats: 10, tableType: 'Table' },
        ],
      },
      {
        name: 'Waterfront Deck',
        tables: [
          { number: 'WD-01', seats: 2, tableType: 'Table' },
          { number: 'WD-02', seats: 2, tableType: 'Table' },
          { number: 'WD-03', seats: 4, tableType: 'Table' },
          { number: 'WD-04', seats: 4, tableType: 'Table' },
          { number: 'WD-05', seats: 4, tableType: 'Table' },
          { number: 'WD-06', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },

  // ── 3. Skyline Lounge (MIXED) ────────────────────────────────────────────
  {
    branchName: 'Skyline Lounge',
    floors: [
      {
        name: 'Lounge Bar',
        tables: [
          { number: 'LB-01', seats: 2, tableType: 'Bar' },
          { number: 'LB-02', seats: 2, tableType: 'Bar' },
          { number: 'LB-03', seats: 2, tableType: 'Bar' },
          { number: 'LB-04', seats: 2, tableType: 'Bar' },
          { number: 'LB-05', seats: 4, tableType: 'Bar' },
          { number: 'LB-06', seats: 4, tableType: 'Bar' },
        ],
      },
      {
        name: 'Dining Hall',
        tables: [
          { number: 'DH-01', seats: 2, tableType: 'Table' },
          { number: 'DH-02', seats: 2, tableType: 'Table' },
          { number: 'DH-03', seats: 4, tableType: 'Table' },
          { number: 'DH-04', seats: 4, tableType: 'Table' },
          { number: 'DH-B1', seats: 4, tableType: 'Booth' },
          { number: 'DH-B2', seats: 4, tableType: 'Booth' },
          { number: 'DH-05', seats: 6, tableType: 'Table' },
          { number: 'DH-06', seats: 8, tableType: 'Table' },
        ],
      },
      {
        name: 'Rooftop Sky Deck',
        tables: [
          { number: 'RD-01', seats: 2, tableType: 'Table' },
          { number: 'RD-02', seats: 2, tableType: 'Table' },
          { number: 'RD-03', seats: 4, tableType: 'Table' },
          { number: 'RD-04', seats: 4, tableType: 'Table' },
          { number: 'RD-05', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },

  // ── 4. Garden Terrace (SEATING) ──────────────────────────────────────────
  {
    branchName: 'Garden Terrace',
    floors: [
      {
        name: 'Garden Level',
        tables: [
          { number: 'GL-01', seats: 2, tableType: 'Table' },
          { number: 'GL-02', seats: 2, tableType: 'Table' },
          { number: 'GL-03', seats: 4, tableType: 'Table' },
          { number: 'GL-04', seats: 4, tableType: 'Table' },
          { number: 'GL-05', seats: 4, tableType: 'Table' },
          { number: 'GL-06', seats: 4, tableType: 'Table' },
          { number: 'GL-07', seats: 6, tableType: 'Table' },
          { number: 'GL-08', seats: 8, tableType: 'Table' },
        ],
      },
      {
        name: 'Pergola Section',
        tables: [
          { number: 'PS-01', seats: 2, tableType: 'Table' },
          { number: 'PS-02', seats: 4, tableType: 'Table' },
          { number: 'PS-03', seats: 4, tableType: 'Table' },
          { number: 'PS-B1', seats: 6, tableType: 'Booth' },
          { number: 'PS-B2', seats: 6, tableType: 'Booth' },
        ],
      },
    ],
  },

  // ── 5. Old Town Tavern (SEATING) ─────────────────────────────────────────
  {
    branchName: 'Old Town Tavern',
    floors: [
      {
        name: 'Tavern Floor',
        tables: [
          { number: 'TF-01', seats: 2, tableType: 'Table' },
          { number: 'TF-02', seats: 2, tableType: 'Table' },
          { number: 'TF-03', seats: 4, tableType: 'Table' },
          { number: 'TF-04', seats: 4, tableType: 'Table' },
          { number: 'TF-B1', seats: 4, tableType: 'Booth' },
          { number: 'TF-B2', seats: 4, tableType: 'Booth' },
          { number: 'TF-B3', seats: 6, tableType: 'Booth' },
          { number: 'TF-05', seats: 8, tableType: 'Table' },
        ],
      },
      {
        name: 'Bar Counter',
        tables: [
          { number: 'BC-01', seats: 1, tableType: 'Bar' },
          { number: 'BC-02', seats: 1, tableType: 'Bar' },
          { number: 'BC-03', seats: 1, tableType: 'Bar' },
          { number: 'BC-04', seats: 1, tableType: 'Bar' },
          { number: 'BC-05', seats: 2, tableType: 'Bar' },
          { number: 'BC-06', seats: 2, tableType: 'Bar' },
        ],
      },
    ],
  },

  // ── 6. Seaside Grill (MIXED) ─────────────────────────────────────────────
  {
    branchName: 'Seaside Grill',
    floors: [
      {
        name: 'Indoor Grill Room',
        tables: [
          { number: 'IG-01', seats: 2, tableType: 'Table' },
          { number: 'IG-02', seats: 2, tableType: 'Table' },
          { number: 'IG-03', seats: 4, tableType: 'Table' },
          { number: 'IG-04', seats: 4, tableType: 'Table' },
          { number: 'IG-05', seats: 4, tableType: 'Table' },
          { number: 'IG-B1', seats: 6, tableType: 'Booth' },
          { number: 'IG-B2', seats: 6, tableType: 'Booth' },
          { number: 'IG-06', seats: 8, tableType: 'Table' },
        ],
      },
      {
        name: 'Seaside Terrace',
        tables: [
          { number: 'ST-01', seats: 2, tableType: 'Table' },
          { number: 'ST-02', seats: 2, tableType: 'Table' },
          { number: 'ST-03', seats: 2, tableType: 'Table' },
          { number: 'ST-04', seats: 4, tableType: 'Table' },
          { number: 'ST-05', seats: 4, tableType: 'Table' },
          { number: 'ST-06', seats: 6, tableType: 'Table' },
          { number: 'ST-07', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },

  // ── 7. The Roastery (SEATING) ────────────────────────────────────────────
  {
    branchName: 'The Roastery',
    floors: [
      {
        name: 'Brew Bar',
        tables: [
          { number: 'BB-01', seats: 2, tableType: 'Bar' },
          { number: 'BB-02', seats: 2, tableType: 'Bar' },
          { number: 'BB-03', seats: 2, tableType: 'Bar' },
          { number: 'BB-04', seats: 4, tableType: 'Bar' },
          { number: 'BB-05', seats: 4, tableType: 'Bar' },
        ],
      },
      {
        name: 'Roastery Lounge',
        tables: [
          { number: 'RL-01', seats: 2, tableType: 'Table' },
          { number: 'RL-02', seats: 2, tableType: 'Table' },
          { number: 'RL-03', seats: 4, tableType: 'Table' },
          { number: 'RL-04', seats: 4, tableType: 'Table' },
          { number: 'RL-B1', seats: 4, tableType: 'Booth' },
          { number: 'RL-B2', seats: 4, tableType: 'Booth' },
          { number: 'RL-05', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },

  // ── 8. Mountain Peak (SEATING) ───────────────────────────────────────────
  {
    branchName: 'Mountain Peak',
    floors: [
      {
        name: 'Summit Dining',
        tables: [
          { number: 'SD-01', seats: 2, tableType: 'Table' },
          { number: 'SD-02', seats: 2, tableType: 'Table' },
          { number: 'SD-03', seats: 4, tableType: 'Table' },
          { number: 'SD-04', seats: 4, tableType: 'Table' },
          { number: 'SD-05', seats: 4, tableType: 'Table' },
          { number: 'SD-06', seats: 4, tableType: 'Table' },
          { number: 'SD-B1', seats: 6, tableType: 'Booth' },
          { number: 'SD-B2', seats: 6, tableType: 'Booth' },
          { number: 'SD-07', seats: 8, tableType: 'Table' },
          { number: 'SD-08', seats: 10, tableType: 'Table' },
        ],
      },
      {
        name: 'Viewpoint Terrace',
        tables: [
          { number: 'VT-01', seats: 2, tableType: 'Table' },
          { number: 'VT-02', seats: 2, tableType: 'Table' },
          { number: 'VT-03', seats: 4, tableType: 'Table' },
          { number: 'VT-04', seats: 4, tableType: 'Table' },
          { number: 'VT-05', seats: 6, tableType: 'Table' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Starting Floor & Table Re-seed...\n');

  // ── Step 1: Wipe all tables then floors ──────────────────────────────────
  const deletedTables = await prisma.table.deleteMany();
  const deletedFloors = await prisma.floor.deleteMany();
  console.log(`🧹  Cleared ${deletedFloors.count} floors and ${deletedTables.count} tables.\n`);

  // ── Step 2: Fetch live branches from DB ──────────────────────────────────
  const branches = await prisma.branch.findMany({
    where: { type: { in: ['SEATING', 'MIXED'] } },
  });

  if (branches.length === 0) {
    console.log('⚠️  No SEATING/MIXED branches found. Aborting.');
    return;
  }

  console.log(`📋  Found ${branches.length} seating-capable branches:\n`);
  branches.forEach(b => console.log(`     • ${b.name} (${b.type})`));
  console.log();

  // ── Step 3: Seed each branch's layout ────────────────────────────────────
  let totalFloors = 0;
  let totalTables = 0;

  for (const branch of branches) {
    // Find the matching layout definition (case-insensitive)
    const layout = BRANCH_LAYOUTS.find(
      l => l.branchName.toLowerCase() === branch.name.toLowerCase()
    );

    if (!layout) {
      console.log(`⚠️  No layout defined for branch "${branch.name}" — skipping.`);
      continue;
    }

    console.log(`🏗️   Seeding: ${branch.name}`);

    for (const floorDef of layout.floors) {
      const floor = await prisma.floor.create({
        data: {
          name: floorDef.name,
          branchId: branch.id,
        },
      });

      // Bulk-create all tables for this floor
      await prisma.table.createMany({
        data: floorDef.tables.map(t => ({
          floorId: floor.id,
          number: t.number,
          seats: t.seats,
          tableType: t.tableType,
          isActive: true,
        })),
      });

      console.log(`     ✔  ${floorDef.name}  →  ${floorDef.tables.length} tables`);
      totalFloors++;
      totalTables += floorDef.tables.length;
    }

    console.log();
  }

  // ── Step 4: Summary ──────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('✅  Floor & Table seeding complete!');
  console.log(`    Branches seeded : ${branches.length}`);
  console.log(`    Floors created  : ${totalFloors}`);
  console.log(`    Tables created  : ${totalTables}`);
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch(e => {
    console.error('❌  Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
