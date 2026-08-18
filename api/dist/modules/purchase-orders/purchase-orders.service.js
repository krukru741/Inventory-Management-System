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
exports.PurchaseOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PurchaseOrdersService = class PurchaseOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto, userId) {
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
                status: client_1.PoStatus.draft,
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
    async approve(id, userId) {
        const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        if (po.status !== client_1.PoStatus.draft && po.status !== client_1.PoStatus.pending_approval) {
            throw new common_1.BadRequestException('PO cannot be approved from its current status');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: client_1.PoStatus.approved,
                approvedById: userId,
                approvedAt: new Date(),
            },
        });
    }
    async receiveGoods(id, dto, userId) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        if (po.status !== client_1.PoStatus.approved && po.status !== client_1.PoStatus.partially_received && po.status !== client_1.PoStatus.ordered) {
            throw new common_1.BadRequestException('PO is not in a receivable state');
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
                if (!poItem)
                    throw new common_1.BadRequestException(`Invalid PO item ID: ${item.poiId}`);
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
                const updatedPoItem = await tx.purchaseOrderItem.update({
                    where: { id: item.poiId },
                    data: { receivedQty: { increment: item.receivedQty } },
                });
                if (Number(updatedPoItem.receivedQty) < Number(updatedPoItem.orderedQty)) {
                    fullyReceived = false;
                }
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
                }
                else {
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
                await tx.stockMovement.create({
                    data: {
                        productId: poItem.productId,
                        variantId: poItem.variantId,
                        locationId: item.locationId,
                        movementType: client_1.MovementType.receipt,
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
            const newStatus = fullyReceived ? client_1.PoStatus.received : client_1.PoStatus.partially_received;
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
    async findOne(id) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { supplier: true, items: true, receipts: true },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        return po;
    }
};
exports.PurchaseOrdersService = PurchaseOrdersService;
exports.PurchaseOrdersService = PurchaseOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchaseOrdersService);
//# sourceMappingURL=purchase-orders.service.js.map