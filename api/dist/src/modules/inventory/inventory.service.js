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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStockSummary(paginationDto, productId) {
        const rows = await this.prisma.$queryRaw `
      SELECT * FROM v_stock_summary
      ${productId ? client_1.Prisma.sql `WHERE product_id = ${productId}::uuid` : client_1.Prisma.empty}
      ORDER BY sku
      OFFSET ${paginationDto.skip} LIMIT ${paginationDto.limit}
    `;
        const [{ count }] = await this.prisma.$queryRaw `
      SELECT COUNT(*)::bigint AS count FROM v_stock_summary
      ${productId ? client_1.Prisma.sql `WHERE product_id = ${productId}::uuid` : client_1.Prisma.empty}
    `;
        return {
            data: rows,
            meta: {
                total: Number(count),
                page: paginationDto.page,
                limit: paginationDto.limit,
            },
        };
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
        try {
            return await this.prisma.$transaction(async (tx) => {
                if (adjustDto.idempotencyKey) {
                    const existing = await tx.stockMovement.findUnique({
                        where: { idempotencyKey: adjustDto.idempotencyKey },
                    });
                    if (existing) {
                        return existing;
                    }
                }
                const lockKey = [
                    adjustDto.productId,
                    adjustDto.locationId,
                    adjustDto.variantId ?? '',
                    adjustDto.batchNumber ?? '',
                    adjustDto.lotNumber ?? '',
                ].join('|');
                await tx.$executeRaw `SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
                const currentStock = await tx.inventory.findFirst({
                    where: {
                        productId: adjustDto.productId,
                        locationId: adjustDto.locationId,
                        variantId: adjustDto.variantId ?? null,
                        batchNumber: adjustDto.batchNumber ?? null,
                        lotNumber: adjustDto.lotNumber ?? null,
                    },
                });
                const currentQty = currentStock
                    ? currentStock.quantity
                    : new client_1.Prisma.Decimal(0);
                const delta = new client_1.Prisma.Decimal(adjustDto.quantityChange);
                const newQty = currentQty.plus(delta);
                if (newQty.lessThan(0)) {
                    throw new common_1.BadRequestException(`Insufficient stock. Current: ${currentQty.toString()}, ` +
                        `requested reduction: ${delta.abs().toString()}`);
                }
                if (currentStock &&
                    newQty.lessThan(currentStock.reservedQty)) {
                    throw new common_1.BadRequestException(`Cannot reduce stock below reserved quantity ` +
                        `(${currentStock.reservedQty.toString()} reserved).`);
                }
                const movement = await tx.stockMovement.create({
                    data: {
                        productId: adjustDto.productId,
                        locationId: adjustDto.locationId,
                        variantId: adjustDto.variantId,
                        movementType,
                        quantity: delta.abs(),
                        balanceAfter: newQty,
                        batchNumber: adjustDto.batchNumber,
                        lotNumber: adjustDto.lotNumber,
                        idempotencyKey: adjustDto.idempotencyKey,
                        reason: adjustDto.reason,
                        performedById: userId,
                    },
                });
                return movement;
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2002' &&
                adjustDto.idempotencyKey) {
                const existing = await this.prisma.stockMovement.findUnique({
                    where: { idempotencyKey: adjustDto.idempotencyKey },
                });
                if (existing)
                    return existing;
                throw new common_1.ConflictException('Duplicate request could not be resolved.');
            }
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2003') {
                throw new common_1.BadRequestException('One or more referenced records (product, location, or variant) do not exist.');
            }
            throw err;
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map