export declare class AdjustInventoryDto {
    productId: string;
    locationId: string;
    variantId?: string;
    quantityChange: number;
    batchNumber?: string;
    lotNumber?: string;
    reason?: string;
    idempotencyKey?: string;
}
