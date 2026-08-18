import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getStockSummary(paginationDto: PaginationDto, productId?: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getLowStockAlerts(): Promise<unknown>;
    adjustStock(adjustInventoryDto: AdjustInventoryDto, user: any): Promise<{
        serialNumber: string | null;
        id: string;
        idempotencyKey: string | null;
        productId: string;
        variantId: string | null;
        locationId: string;
        movementType: import("@prisma/client").$Enums.MovementType;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        unitCost: import("@prisma/client-runtime-utils").Decimal;
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
