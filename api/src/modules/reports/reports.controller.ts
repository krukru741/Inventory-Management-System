import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportQueryDto, DeadStockQueryDto } from './dto/report-query.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CsvInterceptor } from '../../common/interceptors/csv.interceptor';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CsvInterceptor)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Get high-level dashboard metrics' })
  getDashboardMetrics() {
    return this.reportsService.getDashboardMetrics();
  }

  @Get('stock-summary')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get aggregated stock summary' })
  getStockSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getStockSummary(query);
  }

  @Get('low-stock')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff, UserRole.viewer)
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStock(@Query() query: ReportQueryDto) {
    return this.reportsService.getLowStock(query);
  }

  @Get('stock-valuation')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Get stock valuation by warehouse' })
  getStockValuation(@Query() query: ReportQueryDto) {
    return this.reportsService.getStockValuation(query);
  }

  @Get('turnover')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Get stock turnover report' })
  getTurnover(@Query() query: ReportQueryDto) {
    return this.reportsService.getTurnover(query);
  }

  @Get('dead-stock')
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Get dead stock report' })
  getDeadStock(@Query() query: DeadStockQueryDto) {
    return this.reportsService.getDeadStock(query);
  }
}
