"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required for seeding.');
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Starting database seeding...');
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash,
            name: 'System Admin',
            role: client_1.UserRole.admin,
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
            name: 'Warehouse Manager',
            role: client_1.UserRole.manager,
            isActive: true,
        },
    });
    console.log(`Created Manager user: ${manager.email}`);
    const warehouse = await prisma.warehouse.upsert({
        where: { code: 'WH-MAIN' },
        update: {},
        create: {
            code: 'WH-MAIN',
            name: 'Main New York Warehouse',
            addressLine1: '123 Tech Blvd',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            isActive: true,
            locations: {
                create: [
                    { code: 'LOC-A1', name: 'Zone A - Rack 1', locationType: 'rack' },
                    { code: 'LOC-A2', name: 'Zone A - Rack 2', locationType: 'rack' },
                    { code: 'LOC-RECV', name: 'Receiving Dock', locationType: 'receiving_dock' },
                    { code: 'LOC-SHIP', name: 'Shipping Dock', locationType: 'shipping_dock' },
                ],
            },
        },
    });
    console.log(`Created Warehouse: ${warehouse.code} with locations`);
    const supplier = await prisma.supplier.upsert({
        where: { code: 'SUP-TECH' },
        update: {},
        create: {
            code: 'SUP-TECH',
            name: 'Global Tech Supply Co.',
            contactPerson: 'Jane Smith',
            email: 'sales@globaltech.example.com',
            phone: '+1-555-0198',
            isActive: true,
        },
    });
    console.log(`Created Supplier: ${supplier.code}`);
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
    const products = [
        {
            sku: 'SKU-LAPTOP-X1',
            name: 'ThinkPad X1 Carbon Gen 10',
            description: 'Business laptop 16GB RAM 512GB SSD',
            category: { connect: { id: category.id } },
            unitOfMeasure: 'pcs',
            minStockLevel: 10,
            maxStockLevel: 100,
            reorderQuantity: 15,
            trackBatch: true,
            trackSerial: true,
        },
        {
            sku: 'SKU-MOUSE-M705',
            name: 'Logitech M705 Wireless Mouse',
            description: 'Marathon wireless mouse',
            category: { connect: { id: category.id } },
            unitOfMeasure: 'pcs',
            minStockLevel: 20,
            maxStockLevel: 200,
            reorderQuantity: 30,
            trackBatch: false,
            trackSerial: false,
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
    const customer = await prisma.customer.upsert({
        where: { code: 'CUST-001' },
        update: {},
        create: {
            code: 'CUST-001',
            name: 'Acme Corp',
            contactPerson: 'John Doe',
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
    await pool.end();
});
//# sourceMappingURL=seed.js.map