import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateTransferDto, userId: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: string | null;
            productId: string;
            variantId: string | null;
            batchNumber: string | null;
            transferId: string;
            receivedQty: import("@prisma/client-runtime-utils").Decimal;
            requestedQty: import("@prisma/client-runtime-utils").Decimal;
            sentQty: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        status: import("@prisma/client").$Enums.TransferStatus;
        expectedDate: Date | null;
        approvedById: string | null;
        fromLocationId: string;
        toLocationId: string;
        transferNumber: string;
        transferDate: Date;
        completedDate: Date | null;
    }>;
    dispatch(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        status: import("@prisma/client").$Enums.TransferStatus;
        expectedDate: Date | null;
        approvedById: string | null;
        fromLocationId: string;
        toLocationId: string;
        transferNumber: string;
        transferDate: Date;
        completedDate: Date | null;
    }>;
    receive(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        status: import("@prisma/client").$Enums.TransferStatus;
        expectedDate: Date | null;
        approvedById: string | null;
        fromLocationId: string;
        toLocationId: string;
        transferNumber: string;
        transferDate: Date;
        completedDate: Date | null;
    }>;
    findAll(): Promise<({
        createdBy: {
            id: string;
            email: string;
            name: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: string | null;
            productId: string;
            variantId: string | null;
            batchNumber: string | null;
            transferId: string;
            receivedQty: import("@prisma/client-runtime-utils").Decimal;
            requestedQty: import("@prisma/client-runtime-utils").Decimal;
            sentQty: import("@prisma/client-runtime-utils").Decimal;
        }[];
        fromLocation: {
            warehouse: {
                id: string;
                email: string | null;
                name: string;
                phone: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                addressLine1: string | null;
                addressLine2: string | null;
                city: string | null;
                state: string | null;
                postalCode: string | null;
                country: string | null;
                managerId: string | null;
            };
        } & {
            id: string;
            name: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            locationType: string;
            capacity: import("@prisma/client-runtime-utils").Decimal | null;
            parentId: string | null;
            warehouseId: string;
        };
        toLocation: {
            warehouse: {
                id: string;
                email: string | null;
                name: string;
                phone: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                addressLine1: string | null;
                addressLine2: string | null;
                city: string | null;
                state: string | null;
                postalCode: string | null;
                country: string | null;
                managerId: string | null;
            };
        } & {
            id: string;
            name: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            locationType: string;
            capacity: import("@prisma/client-runtime-utils").Decimal | null;
            parentId: string | null;
            warehouseId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdById: string | null;
        status: import("@prisma/client").$Enums.TransferStatus;
        expectedDate: Date | null;
        approvedById: string | null;
        fromLocationId: string;
        toLocationId: string;
        transferNumber: string;
        transferDate: Date;
        completedDate: Date | null;
    })[]>;
}
