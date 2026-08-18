import { ValuationMethod } from '@prisma/client';
export declare class CreateProductDto {
    sku: string;
    name: string;
    description?: string;
    categoryId?: string;
    unitOfMeasure?: string;
    barcode?: string;
    barcodeType?: string;
    costPrice?: number;
    sellPrice?: number;
    taxRate?: number;
    currency?: string;
    reorderPoint?: number;
    reorderQuantity?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    valuationMethod?: ValuationMethod;
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    trackSerial?: boolean;
    trackBatch?: boolean;
    trackExpiry?: boolean;
    hasVariants?: boolean;
}
