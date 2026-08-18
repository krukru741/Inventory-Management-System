import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
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
            unitCost: Prisma.Decimal;
            locationId: string;
            variantId: string | null;
            quantity: Prisma.Decimal;
            batchNumber: string | null;
            lotNumber: string | null;
            expiryDate: Date | null;
            reservedQty: Prisma.Decimal;
            manufactureDate: Date | null;
        })[];
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
        productId: string;
        unitCost: Prisma.Decimal;
        locationId: string;
        variantId: string | null;
        movementType: import("@prisma/client").$Enums.MovementType;
        quantity: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
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
