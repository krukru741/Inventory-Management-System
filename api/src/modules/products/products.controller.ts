import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Create a new product (Admin/Manager only)' })
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(createProductDto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get products with optional filtering' })
  findAll(@Query() queryProductDto: QueryProductDto) {
    return this.productsService.findAll(queryProductDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID, including stock breakdown' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Update a product (Admin/Manager only)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Soft delete a product (Admin/Manager only)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get stock ledger history for a product' })
  findMovements(@Param('id') id: string, @Query() paginationDto: PaginationDto) {
      return this.productsService.findMovements(id, paginationDto);
  }
}
