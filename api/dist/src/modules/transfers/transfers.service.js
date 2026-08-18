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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TransfersService = class TransfersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto, userId) {
        const transferNumber = `TR-${Date.now()}`;
        return this.prisma.stockTransfer.create({
            data: {
                transferNumber,
                fromLocationId: createDto.fromLocationId,
                toLocationId: createDto.toLocationId,
                createdById: userId,
                status: client_1.TransferStatus.draft,
                items: {
                    create: createDto.items.map(item => ({
                        productId: item.productId,
                        requestedQty: item.quantity,
                        batchNumber: item.batchNumber,
                        serialNumber: item.serialNumber,
                    })),
                },
            },
            include: { items: true },
        });
    }
    async dispatch(id, userId) {
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!transfer)
                throw new common_1.NotFoundException('Transfer not found');
            if (transfer.status !== client_1.TransferStatus.draft) {
                throw new common_1.BadRequestException('Can only dispatch draft transfers');
            }
            for (const item of transfer.items) {
                const inventory = await tx.inventory.findFirst({
                    where: {
                        productId: item.productId,
                        locationId: transfer.fromLocationId
                    },
                });
                if (!inventory || Number(inventory.quantity) < Number(item.requestedQty)) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId} at source location`);
                }
                const balanceAfter = Number(inventory.quantity) - Number(item.requestedQty);
                await tx.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: balanceAfter },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        locationId: transfer.fromLocationId,
                        movementType: client_1.MovementType.transfer_out,
                        quantity: -Number(item.requestedQty),
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
            return tx.stockTransfer.update({
                where: { id: transfer.id },
                data: { status: client_1.TransferStatus.in_transit },
            });
        });
    }
    async receive(id, userId) {
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!transfer)
                throw new common_1.NotFoundException('Transfer not found');
            if (transfer.status !== client_1.TransferStatus.in_transit) {
                throw new common_1.BadRequestException('Can only receive in_transit transfers');
            }
            for (const item of transfer.items) {
                const inventory = await tx.inventory.findFirst({
                    where: {
                        productId: item.productId,
                        locationId: transfer.toLocationId
                    },
                });
                let balanceAfter = Number(item.requestedQty);
                let unitCost = 0;
                if (inventory) {
                    balanceAfter += Number(inventory.quantity);
                    unitCost = Number(inventory.unitCost);
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: { quantity: balanceAfter },
                    });
                }
                else {
                    await tx.inventory.create({
                        data: {
                            productId: item.productId,
                            locationId: transfer.toLocationId,
                            quantity: balanceAfter,
                            unitCost: 0,
                        },
                    });
                }
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        locationId: transfer.toLocationId,
                        movementType: client_1.MovementType.transfer_in,
                        quantity: Number(item.requestedQty),
                        balanceAfter,
                        unitCost,
                        batchNumber: item.batchNumber,
                        serialNumber: item.serialNumber,
                        transferId: transfer.id,
                        idempotencyKey: `transfer-in-${transfer.id}-${item.id}`,
                        performedById: userId,
                    },
                });
            }
            return tx.stockTransfer.update({
                where: { id: transfer.id },
                data: { status: client_1.TransferStatus.completed, approvedById: userId },
            });
        });
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map