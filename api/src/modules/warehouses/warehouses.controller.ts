import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Create a new warehouse (Admin only)' })
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.warehousesService.findAll(paginationDto);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations across all warehouses' })
  findAllLocations() {
    return this.warehousesService.findAllLocations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by ID' })
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Update a warehouse (Admin only)' })
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Soft delete a warehouse (Admin only)' })
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }

  // --- Locations ---
  
  @Get(':id/locations')
  @ApiOperation({ summary: 'Get all locations for a warehouse' })
  findLocations(@Param('id') id: string) {
      return this.warehousesService.findLocations(id);
  }
  
  @Post(':id/locations')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Add a location to a warehouse (Admin/Manager only)' })
  addLocation(@Param('id') id: string, @Body() createLocationDto: CreateLocationDto) {
      return this.warehousesService.addLocation(id, createLocationDto);
  }

  @Patch(':id/locations/:locationId')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Update a location (Admin/Manager only)' })
  updateLocation(
      @Param('id') id: string, 
      @Param('locationId') locationId: string, 
      @Body() updateLocationDto: UpdateLocationDto
    ) {
      return this.warehousesService.updateLocation(id, locationId, updateLocationDto);
  }
}
