import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getStockSummary(paginationDto: PaginationDto, productId?: string): Promise<{
        data: ({
            product: {
                name: string;
                sku: string;
            };
            location: {
                name: string | null;
                code: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            unitCost: import("@prisma/client-runtime-utils").Decimal;
            locationId: string;
            variantId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            batchNumber: string | null;
            lotNumber: string | null;
            expiryDate: Date | null;
            reservedQty: import("@prisma/client-runtime-utils").Decimal;
            manufactureDate: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getLowStockAlerts(): Promise<unknown>;
    adjustStock(adjustInventoryDto: AdjustInventoryDto, user: any): Promise<{
        id: string;
        serialNumber: string | null;
        productId: string;
        unitCost: import("@prisma/client-runtime-utils").Decimal;
        locationId: string;
        variantId: string | null;
        movementType: import("@prisma/client").$Enums.MovementType;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        batchNumber: string | null;
        lotNumber: string | null;
        expiryDate: Date | null;
        poId: string | null;
        soId: string | null;
        returnId: string | null;
        transferId: string | null;
        idempotencyKey: string | null;
        reason: string | null;
        performedById: string | null;
        performedAt: Date;
    }>;
}
