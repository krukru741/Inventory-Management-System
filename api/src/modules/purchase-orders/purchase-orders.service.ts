import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { MovementType, PoStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePurchaseOrderDto, userId: string) {
    const poNumber = `PO-${Date.now()}`;
    const subtotal = createDto.items.reduce((acc, item) => acc + (item.orderedQty * item.unitCost), 0);
    const taxAmount = createDto.items.reduce((acc, item) => acc + (item.orderedQty * item.unitCost * (item.taxRate || 0)), 0);
    const totalAmount = subtotal + taxAmount + (createDto.shippingCost || 0);

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: createDto.supplierId,
        warehouseId: createDto.warehouseId,
        supplierReference: createDto.supplierReference,
        notes: createDto.notes,
        subtotal,
        taxAmount,
        shippingCost: createDto.shippingCost || 0,
        totalAmount,
        currency: createDto.currency || 'USD',
        createdById: userId,
        status: PoStatus.draft,
        items: {
          create: createDto.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            description: item.description,
            orderedQty: item.orderedQty,
            unitCost: item.unitCost,
            taxRate: item.taxRate || 0,
            lineTotal: item.orderedQty * item.unitCost * (1 + (item.taxRate || 0)),
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async approve(id: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== PoStatus.draft && po.status !== PoStatus.pending_approval) {
      throw new BadRequestException('PO cannot be approved from its current status');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PoStatus.approved,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  async receiveGoods(id: string, dto: ReceiveGoodsDto, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== PoStatus.approved && po.status !== PoStatus.partially_received && po.status !== PoStatus.ordered) {
      throw new BadRequestException('PO is not in a receivable state');
    }

    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = `RCPT-${Date.now()}`;
      const receipt = await tx.goodsReceipt.create({
        data: {
          poId: po.id,
          receiptNumber,
          receivedById: userId,
          notes: dto.notes,
        },
      });

      let fullyReceived = true;

      for (const item of dto.items) {
        const poItem = po.items.find(i => i.id === item.poiId);
        if (!poItem) throw new BadRequestException(`Invalid PO item ID: ${item.poiId}`);

        // 1. Create Receipt Item
        await tx.goodsReceiptItem.create({
          data: {
            receiptId: receipt.id,
            poiId: item.poiId,
            locationId: item.locationId,
            receivedQty: item.receivedQty,
            batchNumber: item.batchNumber,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            unitCost: poItem.unitCost,
          },
        });

        // 2. Update PO Item receivedQty
        const updatedPoItem = await tx.purchaseOrderItem.update({
          where: { id: item.poiId },
          data: { receivedQty: { increment: item.receivedQty } },
        });

        if (Number(updatedPoItem.receivedQty) < Number(updatedPoItem.orderedQty)) {
          fullyReceived = false;
        }

        // 3. Upsert Inventory Cache & get balanceAfter
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: poItem.productId,
            variantId: poItem.variantId,
            locationId: item.locationId,
          },
        });

        let balanceAfter = Number(item.receivedQty);
        let currentUnitCost = Number(poItem.unitCost);

        if (inventory) {
          balanceAfter += Number(inventory.quantity);
          const totalValue = (Number(inventory.quantity) * Number(inventory.unitCost)) + (item.receivedQty * Number(poItem.unitCost));
          currentUnitCost = totalValue / balanceAfter;

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: balanceAfter,
              unitCost: currentUnitCost,
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: poItem.productId,
              variantId: poItem.variantId,
              locationId: item.locationId,
              quantity: balanceAfter,
              unitCost: currentUnitCost,
              batchNumber: item.batchNumber,
              lotNumber: item.lotNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            },
          });
        }

        // 4. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            productId: poItem.productId,
            variantId: poItem.variantId,
            locationId: item.locationId,
            movementType: MovementType.receipt,
            quantity: item.receivedQty,
            balanceAfter,
            unitCost: poItem.unitCost,
            batchNumber: item.batchNumber,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            poId: po.id,
            idempotencyKey: `receipt-${receipt.id}-${item.poiId}`,
            performedById: userId,
          },
        });
      }

      // 5. Update PO Status
      const newStatus = fullyReceived ? PoStatus.received : PoStatus.partially_received;
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
      });

      return receipt;
    });
  }

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: true, receipts: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }
}
