import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: createWarehouseDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
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

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { manager: { select: { id: true, name: true } } }
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    try {
      return await this.prisma.warehouse.update({
        where: { id },
        data: updateWarehouseDto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error: any) {
       if (error.code === 'P2025') {
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      throw error;
    }
  }

  // --- Locations ---

  async addLocation(warehouseId: string, createLocationDto: CreateLocationDto) {
    // Verify warehouse exists
    await this.findOne(warehouseId);

    return this.prisma.location.create({
      data: {
        ...createLocationDto,
        warehouseId,
      },
    });
  }

  async findLocations(warehouseId: string) {
    // Verify warehouse exists
    await this.findOne(warehouseId);

    // Get flat list, could be transformed to tree later
    return this.prisma.location.findMany({
      where: { warehouseId },
      orderBy: { code: 'asc' },
    });
  }
  
  async updateLocation(warehouseId: string, locationId: string, updateLocationDto: UpdateLocationDto) {
      try {
          return await this.prisma.location.update({
              where: { id: locationId, warehouseId },
              data: updateLocationDto
          });
      } catch (error: any) {
          if (error.code === 'P2025') {
             throw new NotFoundException(`Location ${locationId} not found in Warehouse ${warehouseId}`);
          }
          throw error;
      }
  }
}
