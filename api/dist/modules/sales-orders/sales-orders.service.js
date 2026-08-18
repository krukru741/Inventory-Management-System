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
exports.SalesOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SalesOrdersService = class SalesOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto, userId) {
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
                status: client_1.SoStatus.draft,
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
    async confirm(id) {
        const so = await this.prisma.salesOrder.findUnique({ where: { id } });
        if (!so)
            throw new common_1.NotFoundException('Sales order not found');
        if (so.status !== client_1.SoStatus.draft) {
            throw new common_1.BadRequestException('SO cannot be confirmed from its current status');
        }
        return this.prisma.salesOrder.update({
            where: { id },
            data: { status: client_1.SoStatus.confirmed },
        });
    }
    async shipOrder(id, dto, userId) {
        const so = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales order not found');
        if (so.status !== client_1.SoStatus.confirmed && so.status !== client_1.SoStatus.partially_shipped) {
            throw new common_1.BadRequestException('SO is not in a shippable state');
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
                if (!soItem)
                    throw new common_1.BadRequestException(`Invalid SO item ID: ${item.soiId}`);
                await tx.shipmentItem.create({
                    data: {
                        shipmentId: shipment.id,
                        soiId: item.soiId,
                        locationId: item.locationId,
                        shippedQty: item.shippedQty,
                        batchNumber: item.batchNumber,
                        serialNumber: item.serialNumber,
                    },
                });
                const updatedSoItem = await tx.salesOrderItem.update({
                    where: { id: item.soiId },
                    data: { shippedQty: { increment: item.shippedQty } },
                });
                if (Number(updatedSoItem.shippedQty) < Number(updatedSoItem.orderedQty)) {
                    fullyShipped = false;
                }
                const inventory = await tx.inventory.findFirst({
                    where: {
                        productId: soItem.productId,
                        variantId: soItem.variantId,
                        locationId: item.locationId,
                    },
                });
                if (!inventory || Number(inventory.quantity) < item.shippedQty) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${soItem.productId} at location ${item.locationId}`);
                }
                const balanceAfter = Number(inventory.quantity) - item.shippedQty;
                await tx.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: balanceAfter },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: soItem.productId,
                        variantId: soItem.variantId,
                        locationId: item.locationId,
                        movementType: client_1.MovementType.sale,
                        quantity: item.shippedQty,
                        balanceAfter,
                        unitCost: inventory.unitCost,
                        batchNumber: item.batchNumber,
                        serialNumber: item.serialNumber,
                        soId: so.id,
                        idempotencyKey: `shipment-${shipment.id}-${item.soiId}`,
                        performedById: userId,
                    },
                });
            }
            const newStatus = fullyShipped ? client_1.SoStatus.shipped : client_1.SoStatus.partially_shipped;
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
    async findOne(id) {
        const so = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { customer: true, items: true, shipments: true },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales order not found');
        return so;
    }
};
exports.SalesOrdersService = SalesOrdersService;
exports.SalesOrdersService = SalesOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesOrdersService);
//# sourceMappingURL=sales-orders.service.js.map