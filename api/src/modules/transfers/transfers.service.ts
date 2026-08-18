import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { MovementType, TransferStatus } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTransferDto, userId: string) {
    const transferNumber = `TR-${Date.now()}`;
    return this.prisma.stockTransfer.create({
      data: {
        transferNumber,
        fromLocationId: createDto.fromLocationId,
        toLocationId: createDto.toLocationId,
        createdById: userId,
        status: TransferStatus.draft,
        items: {
          create: createDto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            batchNumber: item.batchNumber,
            serialNumber: item.serialNumber,
          })),
        },
      },
      include: { items: true },
    });
  }

  async dispatch(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== TransferStatus.draft) {
        throw new BadRequestException('Can only dispatch draft transfers');
      }

      // 1. Deduct from fromLocation
      for (const item of transfer.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_locationId: { productId: item.productId, locationId: transfer.fromLocationId },
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${item.productId} at source location`);
        }

        const balanceAfter = inventory.quantity - item.quantity;
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: balanceAfter },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            locationId: transfer.fromLocationId,
            movementType: MovementType.transfer_out,
            quantity: -item.quantity,
            balanceAfter,
            unitCost: inventory.unitCost,
            batchNumber: item.batchNumber,
            serialNumber: item.serialNumber,
            transferId: transfer.id,
            idempotencyKey: `transfer-out-${transfer.id}-${item.id}`,
            performedById: userId,
          },
        });
      }

      // 2. Update Transfer Status
      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.in_transit },
      });
    });
  }

  async receive(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== TransferStatus.in_transit) {
        throw new BadRequestException('Can only receive in_transit transfers');
      }

      // 1. Add to toLocation
      for (const item of transfer.items) {
        const inventory = await tx.inventory.upsert({
          where: {
            productId_locationId: { productId: item.productId, locationId: transfer.toLocationId },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            locationId: transfer.toLocationId,
            quantity: item.quantity,
            unitCost: 0, // In a real app, unitCost would transfer or recompute
          },
        });

        const balanceAfter = inventory.quantity + (inventory.id ? 0 : item.quantity); // If created, inventory.quantity is already the item.quantity

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            locationId: transfer.toLocationId,
            movementType: MovementType.transfer_in,
            quantity: item.quantity,
            balanceAfter: inventory.quantity, // After upsert, this is correct
            unitCost: inventory.unitCost,
            batchNumber: item.batchNumber,
            serialNumber: item.serialNumber,
            transferId: transfer.id,
            idempotencyKey: `transfer-in-${transfer.id}-${item.id}`,
            performedById: userId,
          },
        });
      }

      // 2. Update Transfer Status
      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.completed, approvedById: userId },
      });
    });
  }
}
