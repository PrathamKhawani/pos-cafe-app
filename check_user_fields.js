const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('User model fields:');
  // This is a hacky way to check fields if we can't see types
  try {
     const user = await prisma.user.findFirst();
     console.log('First user keys:', user ? Object.keys(user) : 'No user found');
  } catch (e) {
     console.error('Error fetching user:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
