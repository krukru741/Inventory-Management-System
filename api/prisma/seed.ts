import { PrismaClient, UserRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seeding...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.admin,
      isActive: true,
    },
  });
  console.log(`Created Admin user: ${admin.email}`);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      passwordHash,
      firstName: 'Warehouse',
      lastName: 'Manager',
      role: UserRole.manager,
      isActive: true,
    },
  });
  console.log(`Created Manager user: ${manager.email}`);

  // 2. Create Warehouse and Locations
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: {
      code: 'WH-MAIN',
      name: 'Main New York Warehouse',
      address: '123 Tech Blvd, New York, NY 10001',
      isActive: true,
      locations: {
        create: [
          { code: 'LOC-A1', name: 'Zone A - Rack 1', type: 'rack' },
          { code: 'LOC-A2', name: 'Zone A - Rack 2', type: 'rack' },
          { code: 'LOC-RECV', name: 'Receiving Dock', type: 'receiving_dock' },
          { code: 'LOC-SHIP', name: 'Shipping Dock', type: 'shipping_dock' },
        ],
      },
    },
  });
  console.log(`Created Warehouse: ${warehouse.code} with locations`);

  // 3. Create Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-TECH' },
    update: {},
    create: {
      code: 'SUP-TECH',
      name: 'Global Tech Supply Co.',
      contactName: 'Jane Smith',
      email: 'sales@globaltech.example.com',
      phone: '+1-555-0198',
      isActive: true,
    },
  });
  console.log(`Created Supplier: ${supplier.code}`);

  // 4. Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
    },
  });
  console.log(`Created Category: ${category.name}`);

  // 5. Create Products
  const products = [
    {
      sku: 'SKU-LAPTOP-X1',
      name: 'ThinkPad X1 Carbon Gen 10',
      description: 'Business laptop 16GB RAM 512GB SSD',
      categoryId: category.id,
      uom: 'pcs',
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      isBatchTracked: true,
      isSerialTracked: true,
    },
    {
      sku: 'SKU-MOUSE-M705',
      name: 'Logitech M705 Wireless Mouse',
      description: 'Marathon wireless mouse',
      categoryId: category.id,
      uom: 'pcs',
      minStock: 20,
      maxStock: 200,
      reorderPoint: 30,
      isBatchTracked: false,
      isSerialTracked: false,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    console.log(`Created Product: ${product.sku}`);
  }

  // 6. Create Customers
  const customer = await prisma.customer.upsert({
    where: { code: 'CUST-001' },
    update: {},
    create: {
      code: 'CUST-001',
      name: 'Acme Corp',
      contactName: 'John Doe',
      email: 'john.doe@acmecorp.example.com',
      isActive: true,
    },
  });
  console.log(`Created Customer: ${customer.code}`);

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Close the PG pool explicitly to allow the process to exit cleanly
    await pool.end();
  });
