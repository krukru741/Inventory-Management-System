export declare class TransferItemDto {
    productId: string;
    quantity: number;
    batchNumber?: string;
    serialNumber?: string;
}
export declare class CreateTransferDto {
    fromLocationId: string;
    toLocationId: string;
    items: TransferItemDto[];
}
