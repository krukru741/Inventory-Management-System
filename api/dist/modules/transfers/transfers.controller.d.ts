import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(createDto: CreateTransferDto, req: any): Promise<{
        id: string;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        transferDate: Date;
        expectedDate: Date | null;
        completedDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        fromLocationId: string;
        toLocationId: string;
        createdById: string | null;
        approvedById: string | null;
    }>;
    dispatch(id: string, req: any): Promise<{
        id: string;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        transferDate: Date;
        expectedDate: Date | null;
        completedDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        fromLocationId: string;
        toLocationId: string;
        createdById: string | null;
        approvedById: string | null;
    }>;
    receive(id: string, req: any): Promise<{
        id: string;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        transferDate: Date;
        expectedDate: Date | null;
        completedDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        fromLocationId: string;
        toLocationId: string;
        createdById: string | null;
        approvedById: string | null;
    }>;
}
