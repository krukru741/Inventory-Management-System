import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Request() req) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get all purchase orders' })
  findAll() {
    return this.purchaseOrdersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Approve a purchase order' })
  approve(@Param('id') id: string, @Request() req) {
    return this.purchaseOrdersService.approve(id, req.user.id);
  }

  @Post(':id/receive')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Receive goods against a purchase order' })
  receiveGoods(@Param('id') id: string, @Body() receiveGoodsDto: ReceiveGoodsDto, @Request() req) {
    return this.purchaseOrdersService.receiveGoods(id, receiveGoodsDto, req.user.id);
  }
}
