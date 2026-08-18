import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any): Promise<{
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
    markAsRead(id: string, req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
