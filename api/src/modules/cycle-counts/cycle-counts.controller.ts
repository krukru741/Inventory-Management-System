import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CycleCountsService } from './cycle-counts.service';
import { CreateCycleCountDto, CountItemDto } from './dto/cycle-count.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('cycle-counts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cycle-counts')
export class CycleCountsController {
  constructor(private readonly cycleCountsService: CycleCountsService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Create a new cycle count draft' })
  create(@Body() createDto: CreateCycleCountDto, @Request() req) {
    return this.cycleCountsService.create(createDto, req.user.sub);
  }

  @Post(':id/locations/:locationId/products/:productId/count')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Record counted quantity for an item' })
  countItem(
    @Param('id') id: string,
    @Param('locationId') locationId: string,
    @Param('productId') productId: string,
    @Body() countDto: CountItemDto,
    @Request() req
  ) {
    return this.cycleCountsService.countItem(id, locationId, productId, countDto, req.user.sub);
  }

  @Post(':id/post-adjustments')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Post stock adjustments based on count discrepancies' })
  postAdjustments(@Param('id') id: string, @Request() req) {
    return this.cycleCountsService.postAdjustments(id, req.user.sub);
  }
}
