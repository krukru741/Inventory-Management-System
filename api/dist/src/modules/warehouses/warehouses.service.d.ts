import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class WarehousesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createWarehouseDto: CreateWarehouseDto): Promise<{
        id: string;
        name: string;
        email: string | null;
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
    }>;
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
            id: string;
            name: string;
            email: string | null;
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
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    findOne(id: string): Promise<{
        manager: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        email: string | null;
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
    }>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<{
        id: string;
        name: string;
        email: string | null;
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
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        email: string | null;
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
    }>;
    addLocation(warehouseId: string, createLocationDto: CreateLocationDto): Promise<{
        id: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
        warehouseId: string;
    }>;
    findLocations(warehouseId: string): Promise<{
        id: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
        warehouseId: string;
    }[]>;
    updateLocation(warehouseId: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<{
        id: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
        warehouseId: string;
    }>;
}
