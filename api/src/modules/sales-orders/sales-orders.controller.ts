import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('sales-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Create a new sales order' })
  create(@Body() createSalesOrderDto: CreateSalesOrderDto, @Request() req: any) {
    return this.salesOrdersService.create(createSalesOrderDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get all sales orders' })
  findAll() {
    return this.salesOrdersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get a sales order by ID' })
  findOne(@Param('id') id: string) {
    return this.salesOrdersService.findOne(id);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Confirm a sales order' })
  confirm(@Param('id') id: string) {
    return this.salesOrdersService.confirm(id);
  }

  @Post(':id/ship')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Ship a sales order' })
  shipOrder(@Param('id') id: string, @Body() shipOrderDto: ShipOrderDto, @Request() req: any) {
    return this.salesOrdersService.shipOrder(id, shipOrderDto, req.user.id);
  }
}
