import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProductDto: CreateProductDto, userId?: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        description: string | null;
        sku: string;
        barcode: string | null;
        categoryId: string | null;
        unitOfMeasure: string;
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
    findAll(queryDto: QueryProductDto): Promise<{
        data: ({
            category: {
                id: string;
                name: string;
            } | null;
            images: {
                url: string;
            }[];
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            notes: string | null;
            description: string | null;
            sku: string;
            barcode: string | null;
            categoryId: string | null;
            unitOfMeasure: string;
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
        category: {
            id: string;
            name: string;
        } | null;
        images: {
            id: string;
            createdAt: Date;
            sortOrder: number;
            url: string;
            productId: string;
            isPrimary: boolean;
            altText: string | null;
        }[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        description: string | null;
        sku: string;
        barcode: string | null;
        categoryId: string | null;
        unitOfMeasure: string;
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
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        description: string | null;
        sku: string;
        barcode: string | null;
        categoryId: string | null;
        unitOfMeasure: string;
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
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        notes: string | null;
        description: string | null;
        sku: string;
        barcode: string | null;
        categoryId: string | null;
        unitOfMeasure: string;
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
}
