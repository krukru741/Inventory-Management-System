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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductDto, userId) {
        return this.prisma.product.create({
            data: {
                ...createProductDto,
                createdById: userId,
            },
        });
    }
    async findAll(queryDto) {
        const { skip, limit, search, category, sku, lowStock } = queryDto;
        const where = { isActive: true };
        if (category) {
            where.categoryId = category;
        }
        if (sku) {
            where.sku = { contains: sku, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true } },
                    images: { where: { isPrimary: true }, select: { url: true } }
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data, meta: { total, page: queryDto.page, limit } };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                images: { orderBy: { sortOrder: 'asc' } },
                productSuppliers: {
                    include: { supplier: { select: { id: true, name: true } } }
                },
                inventory: {
                    include: { location: { select: { id: true, name: true, code: true } } }
                }
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async update(id, updateProductDto) {
        try {
            return await this.prisma.product.update({
                where: { id },
                data: updateProductDto,
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.product.update({
                where: { id },
                data: { isActive: false },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            throw error;
        }
    }
    async findMovements(id, paginationDto) {
        const { skip, limit } = paginationDto;
        await this.findOne(id);
        const [data, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                where: { productId: id },
                skip,
                take: limit,
                orderBy: { performedAt: 'desc' },
                include: {
                    location: { select: { name: true, code: true } },
                    performedBy: { select: { name: true } }
                }
            }),
            this.prisma.stockMovement.count({ where: { productId: id } })
        ]);
        return { data, meta: { total, page: paginationDto.page, limit } };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map