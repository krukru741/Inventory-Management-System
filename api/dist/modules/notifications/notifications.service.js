"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pollLowStockAlerts() {
        this.logger.debug('Polling v_low_stock_alerts for new notifications...');
        const alerts = await this.prisma.$queryRaw `SELECT * FROM v_low_stock_alerts`;
        const managers = await this.prisma.user.findMany({
            where: { role: { in: ['admin', 'manager'] }, isActive: true }
        });
        if (managers.length === 0)
            return;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        for (const alert of alerts) {
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
                    channel: client_1.NotificationChannel.in_app,
                    status: client_1.NotificationStatus.pending,
                }));
                await this.prisma.notification.createMany({ data: newNotifications });
            }
        }
    }
    async getMyNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markAsRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: { id, recipientId: userId },
            data: { status: client_1.NotificationStatus.read, readAt: new Date() }
        });
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "pollLowStockAlerts", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map