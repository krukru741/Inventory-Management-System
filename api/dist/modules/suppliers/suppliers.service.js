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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSupplierDto) {
        return this.prisma.supplier.create({
            data: createSupplierDto,
        });
    }
    async findAll(paginationDto) {
        const { skip, limit } = paginationDto;
        const [data, total] = await Promise.all([
            this.prisma.supplier.findMany({
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.supplier.count(),
        ]);
        return { data, meta: { total, page: paginationDto.page, limit } };
    }
    async findOne(id) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Supplier with ID ${id} not found`);
        }
        return supplier;
    }
    async findProducts(id) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            select: {
                productSuppliers: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: { select: { id: true, name: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Supplier with ID ${id} not found`);
        }
        return supplier.productSuppliers.map(ps => ({
            ...ps.product,
            supplierSku: ps.supplierSku,
            unitCost: ps.unitCost,
            minOrderQty: ps.minOrderQty,
            leadTimeDays: ps.leadTimeDays,
            isPreferred: ps.isPreferred,
            psId: ps.id
        }));
    }
    async update(id, updateSupplierDto) {
        try {
            return await this.prisma.supplier.update({
                where: { id },
                data: updateSupplierDto,
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Supplier with ID ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.supplier.update({
                where: { id },
                data: { isActive: false }
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Supplier with ID ${id} not found`);
            }
            throw error;
        }
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map