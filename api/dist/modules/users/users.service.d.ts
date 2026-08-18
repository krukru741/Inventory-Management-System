import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
            email: string;
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    findOne(id: string): Promise<{
        email: string;
        id: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        id: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<{
        message: string;
    }>;
}
