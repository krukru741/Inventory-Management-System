import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
            id: string;
            email: string;
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
    findOne(id: string, user: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto, user: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    updatePassword(id: string, updatePasswordDto: UpdatePasswordDto, user: any): Promise<{
        message: string;
    }>;
}
