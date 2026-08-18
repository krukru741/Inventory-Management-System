import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
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

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async findProducts(id: string) {
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
        throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // Flatten response slightly for convenience
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

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    try {
      return await this.prisma.supplier.update({
        where: { id },
        data: updateSupplierDto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Typically we'd soft delete, but we'll use active flag
      return await this.prisma.supplier.update({
        where: { id },
        data: { isActive: false }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }
      throw error;
    }
  }
}
