export declare class PurchaseOrderItemDto {
    productId: string;
    variantId?: string;
    description?: string;
    orderedQty: number;
    unitCost: number;
    taxRate?: number;
    notes?: string;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    warehouseId: string;
    supplierReference?: string;
    notes?: string;
    shippingCost?: number;
    currency?: string;
    items: PurchaseOrderItemDto[];
}
