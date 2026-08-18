export declare class ShipmentItemDto {
    soiId: string;
    locationId: string;
    shippedQty: number;
    batchNumber?: string;
    serialNumber?: string;
}
export declare class ShipOrderDto {
    carrier?: string;
    trackingNumber?: string;
    notes?: string;
    items: ShipmentItemDto[];
}
