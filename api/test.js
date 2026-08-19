const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.$queryRaw`SELECT * FROM v_stock_summary LIMIT 1`;
  console.log(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main().finally(() => prisma.$disconnect());
