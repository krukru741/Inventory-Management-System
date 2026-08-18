import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateTransferDto, userId: string): Promise<{
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
    dispatch(id: string, userId: string): Promise<{
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
    receive(id: string, userId: string): Promise<{
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
