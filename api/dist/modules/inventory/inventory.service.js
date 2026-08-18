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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStockSummary(paginationDto, productId) {
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
        return this.prisma.$queryRaw `SELECT * FROM v_low_stock_alerts`;
    }
    async adjustStock(adjustDto, userId) {
        if (adjustDto.quantityChange === 0) {
            throw new common_1.BadRequestException('Quantity change cannot be zero');
        }
        const movementType = adjustDto.quantityChange > 0
            ? client_1.MovementType.adjustment_in
            : client_1.MovementType.adjustment_out;
        return this.prisma.$transaction(async (tx) => {
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
                throw new common_1.BadRequestException(`Insufficient stock. Current: ${currentQty}, Requested reduction: ${Math.abs(adjustDto.quantityChange)}`);
            }
            const movement = await tx.stockMovement.create({
                data: {
                    productId: adjustDto.productId,
                    locationId: adjustDto.locationId,
                    variantId: adjustDto.variantId,
                    movementType: movementType,
                    quantity: Math.abs(adjustDto.quantityChange),
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map