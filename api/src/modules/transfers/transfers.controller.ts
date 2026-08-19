import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.manager)
  @ApiOperation({ summary: 'Create a stock transfer' })
  create(@Body() createDto: CreateTransferDto, @Request() req: any) {
    return this.transfersService.create(createDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Get all stock transfers' })
  findAll() {
    return this.transfersService.findAll();
  }

  @Post(':id/dispatch')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Dispatch a stock transfer' })
  dispatch(@Param('id') id: string, @Request() req: any) {
    return this.transfersService.dispatch(id, req.user.sub);
  }

  @Post(':id/receive')
  @Roles(UserRole.admin, UserRole.manager, UserRole.staff)
  @ApiOperation({ summary: 'Receive a stock transfer' })
  receive(@Param('id') id: string, @Request() req: any) {
    return this.transfersService.receive(id, req.user.sub);
  }
}
