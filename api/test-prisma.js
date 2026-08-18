require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    console.log("Success:", user);
  } catch (error) {
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
