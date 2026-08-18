import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(createDto: CreateTransferDto, req: any): Promise<{
        items: {
            serialNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
    dispatch(id: string, req: any): Promise<{
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
    receive(id: string, req: any): Promise<{
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
