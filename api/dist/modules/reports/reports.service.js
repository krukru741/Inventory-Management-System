"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardMetrics() {
        const [[productsResult], [inventoryResult], [lowStockResult], [poResult], [soResult]] = await Promise.all([
            this.prisma.$queryRaw `SELECT COUNT(*) as count FROM products WHERE is_active = true`,
            this.prisma.$queryRaw `SELECT SUM(quantity * unit_cost) as total FROM inventory`,
            this.prisma.$queryRaw `SELECT COUNT(*) as count FROM v_low_stock_alerts`,
            this.prisma.$queryRaw `SELECT COUNT(*) as count FROM v_open_purchase_orders`,
            this.prisma.$queryRaw `SELECT COUNT(*) as count FROM v_open_sales_orders`,
        ]);
        return {
            totalProductsCount: Number(productsResult?.count || 0),
            totalInventoryValue: Number(inventoryResult?.total || 0),
            lowStockAlertsCount: Number(lowStockResult?.count || 0),
            openPurchaseOrdersCount: Number(poResult?.count || 0),
            openSalesOrdersCount: Number(soResult?.count || 0),
        };
    }
    async getStockSummary(query) {
        const warehouseId = query.warehouseId ? client_1.Prisma.sql `${query.warehouseId}::uuid` : client_1.Prisma.sql `NULL`;
        return this.prisma.$queryRaw `
      SELECT * FROM v_stock_summary 
      WHERE (${warehouseId} IS NULL OR warehouse_id = ${warehouseId})
    `;
    }
    async getLowStock(query) {
        const warehouseId = query.warehouseId ? client_1.Prisma.sql `${query.warehouseId}::uuid` : client_1.Prisma.sql `NULL`;
        return this.prisma.$queryRaw `
      SELECT * FROM v_low_stock_alerts
      WHERE (${warehouseId} IS NULL OR warehouse_id = ${warehouseId})
    `;
    }
    async getStockValuation(query) {
        const warehouseId = query.warehouseId ? client_1.Prisma.sql `${query.warehouseId}::uuid` : client_1.Prisma.sql `NULL`;
        return this.prisma.$queryRaw `
      SELECT 
        warehouse_id, 
        warehouse_name, 
        SUM(on_hand_qty) as total_qty, 
        SUM(stock_value) as total_value
      FROM v_stock_summary
      WHERE (${warehouseId} IS NULL OR warehouse_id = ${warehouseId})
      GROUP BY warehouse_id, warehouse_name
    `;
    }
    async getTurnover(query) {
        const warehouseId = query.warehouseId ? client_1.Prisma.sql `${query.warehouseId}::uuid` : client_1.Prisma.sql `NULL`;
        return this.prisma.$queryRaw `
      SELECT 
        p.id as product_id,
        p.sku,
        p.name as product_name,
        COALESCE(SUM(sm.quantity), 0) as total_outbound
      FROM products p
      LEFT JOIN stock_movements sm ON sm.product_id = p.id AND sm.movement_type IN ('sale', 'transfer_out')
      LEFT JOIN locations l ON l.id = sm.location_id
      WHERE (${warehouseId} IS NULL OR l.warehouse_id = ${warehouseId})
      GROUP BY p.id, p.sku, p.name
      ORDER BY total_outbound DESC
    `;
    }
    async getDeadStock(query) {
        const daysThreshold = query.daysThreshold || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
        return this.prisma.$queryRaw `
      SELECT 
        p.id as product_id,
        p.sku,
        p.name as product_name,
        MAX(sm.performed_at) as last_movement_date,
        SUM(i.quantity) as current_stock,
        SUM(i.quantity * i.unit_cost) as stock_value
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      LEFT JOIN stock_movements sm ON sm.product_id = p.id AND sm.movement_type IN ('sale', 'transfer_out')
      GROUP BY p.id, p.sku, p.name
      HAVING (MAX(sm.performed_at) < ${cutoffDate} OR MAX(sm.performed_at) IS NULL)
        AND SUM(i.quantity) > 0
      ORDER BY stock_value DESC
    `;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map