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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let WarehousesService = class WarehousesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createWarehouseDto) {
        return this.prisma.warehouse.create({
            data: createWarehouseDto,
        });
    }
    async findAll(paginationDto) {
        const [data, total] = await Promise.all([
            this.prisma.warehouse.findMany({
                where: { isActive: true },
                skip: paginationDto.skip,
                take: paginationDto.limit,
            }),
            this.prisma.warehouse.count({ where: { isActive: true } }),
        ]);
        return { data, meta: { total, page: paginationDto.page, limit: paginationDto.limit } };
    }
    async findAllLocations() {
        return this.prisma.location.findMany({
            where: { isActive: true },
            include: { warehouse: { select: { name: true } } },
            orderBy: [{ warehouseId: 'asc' }, { code: 'asc' }],
        });
    }
    async findOne(id) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            include: { manager: { select: { id: true, name: true } } }
        });
        if (!warehouse) {
            throw new common_1.NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return warehouse;
    }
    async update(id, updateWarehouseDto) {
        try {
            return await this.prisma.warehouse.update({
                where: { id },
                data: updateWarehouseDto,
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Warehouse with ID ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.warehouse.update({
                where: { id },
                data: { isActive: false },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Warehouse with ID ${id} not found`);
            }
            throw error;
        }
    }
    async addLocation(warehouseId, createLocationDto) {
        await this.findOne(warehouseId);
        return this.prisma.location.create({
            data: {
                ...createLocationDto,
                warehouseId,
            },
        });
    }
    async findLocations(warehouseId) {
        await this.findOne(warehouseId);
        return this.prisma.location.findMany({
            where: { warehouseId },
            orderBy: { code: 'asc' },
        });
    }
    async updateLocation(warehouseId, locationId, updateLocationDto) {
        try {
            return await this.prisma.location.update({
                where: { id: locationId, warehouseId },
                data: updateLocationDto
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Location ${locationId} not found in Warehouse ${warehouseId}`);
            }
            throw error;
        }
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map