import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async pollLowStockAlerts() {
    this.logger.debug('Polling v_low_stock_alerts for new notifications...');
    
    // Find all low stock products
    const alerts: any[] = await this.prisma.$queryRaw`SELECT * FROM v_low_stock_alerts`;
    
    // Find admins and managers to notify
    const managers = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'manager'] }, isActive: true }
    });
    
    if (managers.length === 0) return;

    // We only want to alert if we haven't alerted for this product in the last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const alert of alerts) {
      // Find the most recent notification for this product
      // Since notifications don't have a direct product_id, we check the metadata JSON (or just title/content)
      // For MVP we just query the recent ones by title containing the SKU.
      const recentNotification = await this.prisma.notification.findFirst({
        where: {
          subject: { contains: alert.sku },
          createdAt: { gte: twentyFourHoursAgo },
        }
      });

      if (!recentNotification) {
        this.logger.debug(`Generating low stock alert for ${alert.sku}`);
        const newNotifications = managers.map(m => ({
          recipientId: m.id,
          subject: `Low Stock Alert: ${alert.sku}`,
          body: `${alert.product_name} is running low at ${alert.warehouse_name} (${alert.location_code}). On hand: ${alert.on_hand_qty}. Reorder point: ${alert.reorder_point}.`,
          channel: NotificationChannel.in_app,
          status: NotificationStatus.pending,
        }));
        
        await this.prisma.notification.createMany({ data: newNotifications });
      }
    }
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { status: NotificationStatus.read, readAt: new Date() }
    });
  }
}
