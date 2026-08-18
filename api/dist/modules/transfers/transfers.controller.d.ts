import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(createDto: CreateTransferDto, req: any): Promise<{
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
