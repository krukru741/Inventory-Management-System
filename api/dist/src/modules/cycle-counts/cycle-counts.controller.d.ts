import { CycleCountsService } from './cycle-counts.service';
import { CreateCycleCountDto, CountItemDto } from './dto/cycle-count.dto';
export declare class CycleCountsController {
    private readonly cycleCountsService;
    constructor(cycleCountsService: CycleCountsService);
    create(createDto: CreateCycleCountDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        warehouseId: string;
        status: string;
        countNumber: string;
        scheduledDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    countItem(id: string, locationId: string, productId: string, countDto: CountItemDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        locationId: string;
        variantId: string | null;
        batchNumber: string | null;
        countedQty: import("@prisma/client-runtime-utils").Decimal | null;
        countId: string;
        systemQty: import("@prisma/client-runtime-utils").Decimal;
        countedById: string | null;
        countedAt: Date | null;
        adjustmentPosted: boolean;
        stockMovementId: string | null;
    }>;
    postAdjustments(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        warehouseId: string;
        status: string;
        countNumber: string;
        scheduledDate: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
}
