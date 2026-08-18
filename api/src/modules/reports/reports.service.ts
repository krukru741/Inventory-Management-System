import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, DeadStockQueryDto } from './dto/report-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [[productsResult], [inventoryResult], [lowStockResult], [poResult], [soResult]] = await Promise.all([
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM products WHERE is_active = true`,
      this.prisma.$queryRaw<{ total: number }[]>`SELECT SUM(quantity * unit_cost) as total FROM inventory`,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM v_low_stock_alerts`,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM v_open_purchase_orders`,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM v_open_sales_orders`,
    ]);

    return {
      totalProductsCount: Number(productsResult?.count || 0),
      totalInventoryValue: Number(inventoryResult?.total || 0),
      lowStockAlertsCount: Number(lowStockResult?.count || 0),
      openPurchaseOrdersCount: Number(poResult?.count || 0),
      openSalesOrdersCount: Number(soResult?.count || 0),
    };
  }

  async getStockSummary(query: ReportQueryDto) {
    const warehouseId = query.warehouseId ? Prisma.sql`${query.warehouseId}::uuid` : Prisma.sql`NULL`;
    
    return this.prisma.$queryRaw`
      SELECT * FROM v_stock_summary 
      WHERE (${warehouseId} IS NULL OR warehouse_id = ${warehouseId})
    `;
  }

  async getLowStock(query: ReportQueryDto) {
    const warehouseId = query.warehouseId ? Prisma.sql`${query.warehouseId}::uuid` : Prisma.sql`NULL`;
    
    return this.prisma.$queryRaw`
      SELECT * FROM v_low_stock_alerts
      WHERE (${warehouseId} IS NULL OR warehouse_id = ${warehouseId})
    `;
  }

  async getStockValuation(query: ReportQueryDto) {
    const warehouseId = query.warehouseId ? Prisma.sql`${query.warehouseId}::uuid` : Prisma.sql`NULL`;
    
    // Aggregate v_stock_summary by warehouse
    return this.prisma.$queryRaw`
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

  async getTurnover(query: ReportQueryDto) {
    // Turnover is outbound movement (MovementType = 'sale' | 'transfer_out')
    const warehouseId = query.warehouseId ? Prisma.sql`${query.warehouseId}::uuid` : Prisma.sql`NULL`;
    
    return this.prisma.$queryRaw`
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

  async getDeadStock(query: DeadStockQueryDto) {
    const daysThreshold = query.daysThreshold || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    
    return this.prisma.$queryRaw`
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
}
