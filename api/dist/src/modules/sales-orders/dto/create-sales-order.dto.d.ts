export declare class SalesOrderItemDto {
    productId: string;
    variantId?: string;
    description?: string;
    orderedQty: number;
    unitPrice: number;
    discountPct?: number;
    taxRate?: number;
    notes?: string;
}
export declare class CreateSalesOrderDto {
    customerId: string;
    warehouseId: string;
    shipToName?: string;
    shipToLine1?: string;
    shipToCity?: string;
    shipToState?: string;
    shipToPostal?: string;
    shipToCountry?: string;
    customerPoRef?: string;
    notes?: string;
    discountAmount?: number;
    shippingCost?: number;
    currency?: string;
    items: SalesOrderItemDto[];
}
