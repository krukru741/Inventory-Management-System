import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { MovementType, Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockSummary(paginationDto: PaginationDto, productId?: string) {
    // In a real app, this would query the `v_stock_summary` view using raw SQL
    // Example: return this.prisma.$queryRaw`SELECT * FROM v_stock_summary OFFSET ${paginationDto.skip} LIMIT ${paginationDto.limit}`;
    
    // Fallback to Prisma query if views aren't available in schema
    const where = productId ? { productId } : {};
    
    const [data, total] = await Promise.all([
       this.prisma.inventory.findMany({
           where,
           skip: paginationDto.skip,
           take: paginationDto.limit,
           include: {
               product: { select: { sku: true, name: true } },
               location: { select: { code: true, name: true } }
           }
       }),
       this.prisma.inventory.count({ where })
    ]);

    return { data, meta: { total, page: paginationDto.page, limit: paginationDto.limit } };
  }

  async getLowStockAlerts() {
     // This would query `v_low_stock_alerts` view
     return this.prisma.$queryRaw`SELECT * FROM v_low_stock_alerts`;
  }

  async adjustStock(adjustDto: AdjustInventoryDto, userId?: string) {
    if (adjustDto.quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero');
    }

    const movementType = adjustDto.quantityChange > 0 
      ? MovementType.adjustment_in 
      : MovementType.adjustment_out;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get current stock
      const currentStock = await tx.inventory.findFirst({
        where: {
          productId: adjustDto.productId,
          locationId: adjustDto.locationId,
          variantId: adjustDto.variantId || null,
          batchNumber: adjustDto.batchNumber || null,
          lotNumber: adjustDto.lotNumber || null,
        }
      });

      const currentQty = currentStock ? Number(currentStock.quantity) : 0;
      const newQty = currentQty + adjustDto.quantityChange;

      if (newQty < 0) {
        throw new BadRequestException(`Insufficient stock. Current: ${currentQty}, Requested reduction: ${Math.abs(adjustDto.quantityChange)}`);
      }

      // 2. Insert Stock Movement
      // The DB trigger `sync_inventory_on_movement` will automatically handle upserting
      // the inventory table using `balanceAfter`. However, we explicitly pass the exact balance
      // here to maintain standard CQRS principles at the application level.
      const movement = await tx.stockMovement.create({
        data: {
          productId: adjustDto.productId,
          locationId: adjustDto.locationId,
          variantId: adjustDto.variantId,
          movementType: movementType,
          quantity: Math.abs(adjustDto.quantityChange), // DB expects absolute value for the movement row
          balanceAfter: newQty,
          batchNumber: adjustDto.batchNumber,
          lotNumber: adjustDto.lotNumber,
          idempotencyKey: adjustDto.idempotencyKey,
          reason: adjustDto.reason,
          performedById: userId,
        }
      });

      return movement;
    });
  }
}
