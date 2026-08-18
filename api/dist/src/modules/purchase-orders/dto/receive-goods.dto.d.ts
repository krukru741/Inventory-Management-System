export declare class GoodsReceiptItemDto {
    poiId: string;
    locationId: string;
    receivedQty: number;
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: string;
}
export declare class ReceiveGoodsDto {
    notes?: string;
    items: GoodsReceiptItemDto[];
}
