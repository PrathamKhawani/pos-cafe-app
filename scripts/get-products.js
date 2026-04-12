const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany().then(products => {
    console.log(products.map(p => p.name).join('\n'));
}).finally(() => {
    prisma.$disconnect();
});
