const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE RESET ---');

  // Deletion order to satisfy constraints
  console.log('Cleaning existing data...');
  await prisma.qRToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.branch.deleteMany();

  console.log('Wiped all branches, floors, tables, tokens, orders, and sessions.');

  const branches = [
    { name: 'Downtown Cafe', type: 'SEATING', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800' },
    { name: 'Harbor Bistro', type: 'SEATING', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800' },
    { name: 'Skyline Lounge', type: 'MIXED', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800' },
    { name: 'Garden Terrace', type: 'SEATING', image: 'https://images.unsplash.com/photo-1533055640609-24b498dfd74c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Urban Express', type: 'TAKEAWAY', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800' },
    { name: 'Old Town Tavern', type: 'SEATING', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800' },
    { name: 'Seaside Grill', type: 'MIXED', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800' },
    { name: 'The Roastery', type: 'SEATING', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800' },
    { name: 'Mountain Peak', type: 'SEATING', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800' },
    { name: 'Metro Plaza', type: 'TAKEAWAY', image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&q=80&w=800' }
  ];

  for (const bData of branches) {
    const branch = await prisma.branch.create({
      data: {
        name: bData.name,
        type: bData.type,
        imageUrl: bData.image
      }
    });

    console.log(`Created Branch: ${branch.name}`);

    // Create 2 Floors for SEATING/MIXED
    if (bData.type !== 'TAKEAWAY') {
      const floors = ['Main Floor', 'Mezzanine'];
      for (const fName of floors) {
        const floor = await prisma.floor.create({
          data: {
            name: fName,
            branchId: branch.id
          }
        });

        // Create 5 Tables for each Floor
        for (let i = 1; i <= 5; i++) {
          const table = await prisma.table.create({
            data: {
              number: `${fName === 'Main Floor' ? 'M' : 'Z'}${i}`,
              seats: i % 2 === 0 ? 4 : 2,
              floorId: floor.id,
              tableType: i === 5 ? 'Booth' : 'Table'
            }
          });

          // Create QR Token for the table
          await prisma.qRToken.create({
            data: {
              tableId: table.id
            }
          });
        }
      }
    }
  }

  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
