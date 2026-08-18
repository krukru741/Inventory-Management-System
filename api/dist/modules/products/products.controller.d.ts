import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, user: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        sku: string;
        categoryId: string | null;
        unitOfMeasure: string;
        barcode: string | null;
        barcodeType: string | null;
        costPrice: import("@prisma/client-runtime-utils").Decimal;
        sellPrice: import("@prisma/client-runtime-utils").Decimal;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
        reorderPoint: import("@prisma/client-runtime-utils").Decimal;
        reorderQuantity: import("@prisma/client-runtime-utils").Decimal;
        minStockLevel: import("@prisma/client-runtime-utils").Decimal;
        maxStockLevel: import("@prisma/client-runtime-utils").Decimal | null;
        valuationMethod: import("@prisma/client").$Enums.ValuationMethod;
        weightKg: import("@prisma/client-runtime-utils").Decimal | null;
        lengthCm: import("@prisma/client-runtime-utils").Decimal | null;
        widthCm: import("@prisma/client-runtime-utils").Decimal | null;
        heightCm: import("@prisma/client-runtime-utils").Decimal | null;
        trackSerial: boolean;
        trackBatch: boolean;
        trackExpiry: boolean;
        hasVariants: boolean;
        createdById: string | null;
    }>;
    findAll(queryProductDto: QueryProductDto): Promise<{
        data: ({
            category: {
                id: string;
                name: string;
            } | null;
            images: {
                url: string;
            }[];
        } & {
            description: string | null;
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            notes: string | null;
            sku: string;
            categoryId: string | null;
            unitOfMeasure: string;
            barcode: string | null;
            barcodeType: string | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal;
            sellPrice: import("@prisma/client-runtime-utils").Decimal;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            reorderPoint: import("@prisma/client-runtime-utils").Decimal;
            reorderQuantity: import("@prisma/client-runtime-utils").Decimal;
            minStockLevel: import("@prisma/client-runtime-utils").Decimal;
            maxStockLevel: import("@prisma/client-runtime-utils").Decimal | null;
            valuationMethod: import("@prisma/client").$Enums.ValuationMethod;
            weightKg: import("@prisma/client-runtime-utils").Decimal | null;
            lengthCm: import("@prisma/client-runtime-utils").Decimal | null;
            widthCm: import("@prisma/client-runtime-utils").Decimal | null;
            heightCm: import("@prisma/client-runtime-utils").Decimal | null;
            trackSerial: boolean;
            trackBatch: boolean;
            trackExpiry: boolean;
            hasVariants: boolean;
            createdById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            name: string;
        } | null;
        inventory: ({
            location: {
                id: string;
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
        productSuppliers: ({
            supplier: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            leadTimeDays: number;
            productId: string;
            supplierId: string;
            supplierSku: string | null;
            unitCost: import("@prisma/client-runtime-utils").Decimal;
            minOrderQty: import("@prisma/client-runtime-utils").Decimal;
            isPreferred: boolean;
        })[];
        images: {
            url: string;
            id: string;
            createdAt: Date;
            sortOrder: number;
            productId: string;
            isPrimary: boolean;
            altText: string | null;
        }[];
    } & {
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        sku: string;
        categoryId: string | null;
        unitOfMeasure: string;
        barcode: string | null;
        barcodeType: string | null;
        costPrice: import("@prisma/client-runtime-utils").Decimal;
        sellPrice: import("@prisma/client-runtime-utils").Decimal;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
        reorderPoint: import("@prisma/client-runtime-utils").Decimal;
        reorderQuantity: import("@prisma/client-runtime-utils").Decimal;
        minStockLevel: import("@prisma/client-runtime-utils").Decimal;
        maxStockLevel: import("@prisma/client-runtime-utils").Decimal | null;
        valuationMethod: import("@prisma/client").$Enums.ValuationMethod;
        weightKg: import("@prisma/client-runtime-utils").Decimal | null;
        lengthCm: import("@prisma/client-runtime-utils").Decimal | null;
        widthCm: import("@prisma/client-runtime-utils").Decimal | null;
        heightCm: import("@prisma/client-runtime-utils").Decimal | null;
        trackSerial: boolean;
        trackBatch: boolean;
        trackExpiry: boolean;
        hasVariants: boolean;
        createdById: string | null;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        sku: string;
        categoryId: string | null;
        unitOfMeasure: string;
        barcode: string | null;
        barcodeType: string | null;
        costPrice: import("@prisma/client-runtime-utils").Decimal;
        sellPrice: import("@prisma/client-runtime-utils").Decimal;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
        reorderPoint: import("@prisma/client-runtime-utils").Decimal;
        reorderQuantity: import("@prisma/client-runtime-utils").Decimal;
        minStockLevel: import("@prisma/client-runtime-utils").Decimal;
        maxStockLevel: import("@prisma/client-runtime-utils").Decimal | null;
        valuationMethod: import("@prisma/client").$Enums.ValuationMethod;
        weightKg: import("@prisma/client-runtime-utils").Decimal | null;
        lengthCm: import("@prisma/client-runtime-utils").Decimal | null;
        widthCm: import("@prisma/client-runtime-utils").Decimal | null;
        heightCm: import("@prisma/client-runtime-utils").Decimal | null;
        trackSerial: boolean;
        trackBatch: boolean;
        trackExpiry: boolean;
        hasVariants: boolean;
        createdById: string | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        sku: string;
        categoryId: string | null;
        unitOfMeasure: string;
        barcode: string | null;
        barcodeType: string | null;
        costPrice: import("@prisma/client-runtime-utils").Decimal;
        sellPrice: import("@prisma/client-runtime-utils").Decimal;
        taxRate: import("@prisma/client-runtime-utils").Decimal;
        reorderPoint: import("@prisma/client-runtime-utils").Decimal;
        reorderQuantity: import("@prisma/client-runtime-utils").Decimal;
        minStockLevel: import("@prisma/client-runtime-utils").Decimal;
        maxStockLevel: import("@prisma/client-runtime-utils").Decimal | null;
        valuationMethod: import("@prisma/client").$Enums.ValuationMethod;
        weightKg: import("@prisma/client-runtime-utils").Decimal | null;
        lengthCm: import("@prisma/client-runtime-utils").Decimal | null;
        widthCm: import("@prisma/client-runtime-utils").Decimal | null;
        heightCm: import("@prisma/client-runtime-utils").Decimal | null;
        trackSerial: boolean;
        trackBatch: boolean;
        trackExpiry: boolean;
        hasVariants: boolean;
        createdById: string | null;
    }>;
    findMovements(id: string, paginationDto: PaginationDto): Promise<{
        data: ({
            location: {
                name: string | null;
                code: string;
            };
            performedBy: {
                name: string;
            } | null;
        } & {
            serialNumber: string | null;
            id: string;
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
}
