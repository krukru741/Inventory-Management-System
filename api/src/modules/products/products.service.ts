import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId?: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        createdById: userId,
      },
    });
  }

  async findAll(queryDto: QueryProductDto) {
    const { skip, limit, search, category, sku, lowStock } = queryDto;

    const where: any = { isActive: true };

    if (category) {
      where.categoryId = category;
    }
    
    if (sku) {
      where.sku = { contains: sku, mode: 'insensitive' };
    }

    // Fuzzy search using pg_trgm would ideally be done via raw query, 
    // but Prisma's `contains` handles basic cases. 
    // For full trigram: `where.name = { search }` if preview features enabled, 
    // or raw query if performance is critical.
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }

    // For low stock, we would ideally query the `v_low_stock_alerts` view.
    // We'll leave that for the Inventory module or a dedicated raw query method here.

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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        productSuppliers: {
            include: { supplier: { select: { id: true, name: true } } }
        },
        // Stock-by-location breakdown
        inventory: {
            include: { location: { select: { id: true, name: true, code: true } } }
        }
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Soft delete
      return await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findMovements(id: string, paginationDto: PaginationDto) {
    const { skip, limit } = paginationDto;
    
    // Verify product exists
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
}
