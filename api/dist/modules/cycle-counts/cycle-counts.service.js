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
exports.CycleCountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CycleCountsService = class CycleCountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto, userId) {
        return this.prisma.cycleCount.create({
            data: {
                warehouseId: createDto.warehouseId,
                notes: createDto.notes,
                createdById: userId,
                status: 'draft',
            },
        });
    }
    async countItem(countId, locationId, productId, countDto, userId) {
        const inventory = await this.prisma.inventory.findUnique({
            where: { productId_locationId: { productId, locationId } }
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
        }
        else {
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
    async postAdjustments(countId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const cycleCount = await tx.cycleCount.findUnique({
                where: { id: countId },
                include: { items: true },
            });
            if (!cycleCount)
                throw new common_1.NotFoundException('Cycle count not found');
            if (cycleCount.status !== 'draft')
                throw new common_1.BadRequestException('Cycle count is already completed');
            for (const item of cycleCount.items) {
                if (item.adjustmentPosted || item.countedQty === null)
                    continue;
                const diff = Number(item.countedQty) - Number(item.systemQty);
                if (diff !== 0) {
                    const inventory = await tx.inventory.upsert({
                        where: { productId_locationId: { productId: item.productId, locationId: item.locationId } },
                        update: { quantity: item.countedQty },
                        create: { productId: item.productId, locationId: item.locationId, quantity: item.countedQty, unitCost: 0 }
                    });
                    const movementType = diff > 0 ? client_1.MovementType.adjustment_in : client_1.MovementType.adjustment_out;
                    const movement = await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            locationId: item.locationId,
                            movementType,
                            quantity: diff,
                            balanceAfter: item.countedQty,
                            unitCost: inventory.unitCost,
                            idempotencyKey: `cc-${countId}-${item.id}`,
                            performedById: userId,
                            reason: 'Cycle Count Adjustment',
                        }
                    });
                    await tx.cycleCountItem.update({
                        where: { id: item.id },
                        data: { adjustmentPosted: true, stockMovementId: movement.id }
                    });
                }
                else {
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
};
exports.CycleCountsService = CycleCountsService;
exports.CycleCountsService = CycleCountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CycleCountsService);
//# sourceMappingURL=cycle-counts.service.js.map