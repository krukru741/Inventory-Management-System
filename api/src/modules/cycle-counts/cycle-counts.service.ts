import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCycleCountDto, CountItemDto } from './dto/cycle-count.dto';
import { MovementType } from '@prisma/client';

@Injectable()
export class CycleCountsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCycleCountDto, userId: string) {
    return this.prisma.cycleCount.create({
      data: {
        countNumber: `CC-${Date.now()}`,
        warehouseId: createDto.warehouseId,
        notes: createDto.notes,
        createdById: userId,
        status: 'draft',
      },
    });
  }

  async countItem(countId: string, locationId: string, productId: string, countDto: CountItemDto, userId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { productId, locationId }
    });
    const systemQty = inventory ? inventory.quantity : 0;

    const item = await this.prisma.cycleCountItem.findFirst({
      where: { countId, productId, locationId }
    });

    if (item) {
      return this.prisma.cycleCountItem.update({
        where: { id: item.id },
        data: {
          countedQty: countDto.countedQty,
          countedById: userId,
          countedAt: new Date(),
        }
      });
    } else {
      return this.prisma.cycleCountItem.create({
        data: {
          countId,
          productId,
          locationId,
          systemQty,
          countedQty: countDto.countedQty,
          countedById: userId,
          countedAt: new Date(),
        }
      });
    }
  }

  async postAdjustments(countId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cycleCount = await tx.cycleCount.findUnique({
        where: { id: countId },
        include: { items: true },
      });

      if (!cycleCount) throw new NotFoundException('Cycle count not found');
      if (cycleCount.status !== 'draft') throw new BadRequestException('Cycle count is already completed');

      for (const item of cycleCount.items) {
        if (item.adjustmentPosted || item.countedQty === null) continue;

        const diff = Number(item.countedQty) - Number(item.systemQty);
        
        if (diff !== 0) {
          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId, locationId: item.locationId }
          });
          
          let unitCost = 0;
          if (inventory) {
            unitCost = Number(inventory.unitCost);
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: item.countedQty }
            });
          } else {
            await tx.inventory.create({
              data: { productId: item.productId, locationId: item.locationId, quantity: Number(item.countedQty), unitCost: 0 }
            });
          }

          const movementType = diff > 0 ? MovementType.adjustment_in : MovementType.adjustment_out;
          
          const movement = await tx.stockMovement.create({
            data: {
              productId: item.productId,
              locationId: item.locationId,
              movementType,
              quantity: diff,
              balanceAfter: item.countedQty,
              unitCost: unitCost,
              idempotencyKey: `cc-${countId}-${item.id}`,
              performedById: userId,
              reason: 'Cycle Count Adjustment',
            }
          });

          await tx.cycleCountItem.update({
            where: { id: item.id },
            data: { adjustmentPosted: true, stockMovementId: movement.id }
          });
        } else {
          await tx.cycleCountItem.update({
            where: { id: item.id },
            data: { adjustmentPosted: true }
          });
        }
      }

      return tx.cycleCount.update({
        where: { id: countId },
        data: { status: 'completed' }
      });
    });
  }
}
