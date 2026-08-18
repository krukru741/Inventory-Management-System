import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current users notifications' })
  getMyNotifications(@Request() req: any) {
    return this.notificationsService.getMyNotifications(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }
}
