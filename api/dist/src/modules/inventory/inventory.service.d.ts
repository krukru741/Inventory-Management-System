import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getStockSummary(paginationDto: PaginationDto, productId?: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getLowStockAlerts(): Promise<unknown>;
    adjustStock(adjustDto: AdjustInventoryDto, userId?: string): Promise<{
        serialNumber: string | null;
        id: string;
        idempotencyKey: string | null;
        productId: string;
        variantId: string | null;
        locationId: string;
        movementType: import("@prisma/client").$Enums.MovementType;
        quantity: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        unitCost: Prisma.Decimal;
        batchNumber: string | null;
        lotNumber: string | null;
        expiryDate: Date | null;
        poId: string | null;
        soId: string | null;
        returnId: string | null;
        transferId: string | null;
        reason: string | null;
        performedById: string | null;
        performedAt: Date;
    }>;
}
