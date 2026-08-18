import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated stock levels' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  getStockSummary(@Query() paginationDto: PaginationDto, @Query('productId') productId?: string) {
    return this.inventoryService.getStockSummary(paginationDto, productId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products below their reorder point' })
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Post('adjust')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Manually adjust stock levels (Admin/Manager only)' })
  adjustStock(@Body() adjustInventoryDto: AdjustInventoryDto, @CurrentUser() user: any) {
    return this.inventoryService.adjustStock(adjustInventoryDto, user?.id);
  }
}
