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
}
