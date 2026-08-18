import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { MovementType, SoStatus } from '@prisma/client';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSalesOrderDto, userId: string) {
    const soNumber = `SO-${Date.now()}`;
    const subtotal = createDto.items.reduce((acc, item) => acc + (item.orderedQty * item.unitPrice), 0);
    const taxAmount = createDto.items.reduce((acc, item) => acc + (item.orderedQty * item.unitPrice * (item.taxRate || 0)), 0);
    const discountAmount = createDto.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount + (createDto.shippingCost || 0);

    return this.prisma.salesOrder.create({
      data: {
        soNumber,
        customerId: createDto.customerId,
        warehouseId: createDto.warehouseId,
        shipToName: createDto.shipToName,
        shipToLine1: createDto.shipToLine1,
        shipToCity: createDto.shipToCity,
        shipToState: createDto.shipToState,
        shipToPostal: createDto.shipToPostal,
        shipToCountry: createDto.shipToCountry,
        customerPoRef: createDto.customerPoRef,
        notes: createDto.notes,
        subtotal,
        taxAmount,
        discountAmount,
        shippingCost: createDto.shippingCost || 0,
        totalAmount,
        currency: createDto.currency || 'USD',
        createdById: userId,
        status: SoStatus.draft,
        items: {
          create: createDto.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            description: item.description,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct || 0,
            taxRate: item.taxRate || 0,
            lineTotal: (item.orderedQty * item.unitPrice * (1 - (item.discountPct || 0))) * (1 + (item.taxRate || 0)),
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async confirm(id: string) {
    const so = await this.prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new NotFoundException('Sales order not found');
    if (so.status !== SoStatus.draft) {
      throw new BadRequestException('SO cannot be confirmed from its current status');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: SoStatus.confirmed },
    });
  }

  async shipOrder(id: string, dto: ShipOrderDto, userId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new NotFoundException('Sales order not found');
    if (so.status !== SoStatus.confirmed && so.status !== SoStatus.partially_shipped) {
      throw new BadRequestException('SO is not in a shippable state');
    }

    return this.prisma.$transaction(async (tx) => {
      const shipmentNumber = `SHP-${Date.now()}`;
      const shipment = await tx.shipment.create({
        data: {
          soId: so.id,
          shipmentNumber,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          notes: dto.notes,
          createdById: userId,
          shippedDate: new Date(),
        },
      });

      let fullyShipped = true;

      for (const item of dto.items) {
        const soItem = so.items.find(i => i.id === item.soiId);
        if (!soItem) throw new BadRequestException(`Invalid SO item ID: ${item.soiId}`);

        // 1. Create Shipment Item
        await tx.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            soiId: item.soiId,
            locationId: item.locationId,
            shippedQty: item.shippedQty,
            batchNumber: item.batchNumber,
            lotNumber: item.lotNumber,
          },
        });

        // 2. Update SO Item shippedQty
        const updatedSoItem = await tx.salesOrderItem.update({
          where: { id: item.soiId },
          data: { shippedQty: { increment: item.shippedQty } },
        });

        if (Number(updatedSoItem.shippedQty) < Number(updatedSoItem.orderedQty)) {
          fullyShipped = false;
        }

        // 3. Update Inventory Cache & get balanceAfter
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: soItem.productId,
            variantId: soItem.variantId,
            locationId: item.locationId,
          },
        });

        if (!inventory || Number(inventory.quantity) < item.shippedQty) {
          throw new BadRequestException(`Insufficient stock for product ${soItem.productId} at location ${item.locationId}`);
        }

        const balanceAfter = Number(inventory.quantity) - item.shippedQty;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: balanceAfter },
        });

        // 4. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            productId: soItem.productId,
            variantId: soItem.variantId,
            locationId: item.locationId,
            movementType: MovementType.sale,
            quantity: item.shippedQty, // Should this be negative? The DB schema uses Decimal. Usually quantities are positive and type implies direction, but let's keep it positive and use movementType to imply deduction. Wait, balanceAfter tells the truth. Let's make quantity negative to represent outbound, or positive? Let's use positive since GoodsReceipt uses positive.
            balanceAfter,
            unitCost: inventory.unitCost, // Outbound at current average cost
            batchNumber: item.batchNumber,
            lotNumber: item.lotNumber,
            soId: so.id,
            idempotencyKey: `shipment-${shipment.id}-${item.soiId}`,
            performedById: userId,
          },
        });
      }

      // 5. Update SO Status
      const newStatus = fullyShipped ? SoStatus.shipped : SoStatus.partially_shipped;
      await tx.salesOrder.update({
        where: { id: so.id },
        data: { 
          status: newStatus,
          shippedDate: fullyShipped ? new Date() : so.shippedDate 
        },
      });

      return shipment;
    });
  }

  findAll() {
    return this.prisma.salesOrder.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { customer: true, items: true, shipments: true },
    });
    if (!so) throw new NotFoundException('Sales order not found');
    return so;
  }
}
