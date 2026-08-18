import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    pollLowStockAlerts(): Promise<void>;
    getMyNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        status: import("@prisma/client").$Enums.NotificationStatus;
        alertRuleId: string | null;
        recipientId: string;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        body: string;
        scheduledAt: Date;
        sentAt: Date | null;
        readAt: Date | null;
        failedReason: string | null;
        retryCount: number;
    }[]>;
    markAsRead(id: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
