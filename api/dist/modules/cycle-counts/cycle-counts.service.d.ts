import { PrismaService } from '../../prisma/prisma.service';
import { CreateCycleCountDto, CountItemDto } from './dto/cycle-count.dto';
export declare class CycleCountsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateCycleCountDto, userId: string): Promise<{
        id: string;
        countNumber: string;
        status: string;
        scheduledDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        createdById: string | null;
    }>;
    countItem(countId: string, itemId: string, countDto: CountItemDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        countId: string;
        productId: string;
        variantId: string | null;
        locationId: string;
        systemQty: import("@prisma/client-runtime-utils").Decimal;
        countedQty: import("@prisma/client-runtime-utils").Decimal | null;
        batchNumber: string | null;
        countedById: string | null;
        countedAt: Date | null;
        adjustmentPosted: boolean;
        stockMovementId: string | null;
    }>;
    postAdjustments(countId: string, userId: string): Promise<void>;
}
