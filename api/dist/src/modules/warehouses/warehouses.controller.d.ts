import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    create(createWarehouseDto: CreateWarehouseDto): Promise<{
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
    }>;
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
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
    }>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    findLocations(id: string): Promise<{
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
    }[]>;
    addLocation(id: string, createLocationDto: CreateLocationDto): Promise<{
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
    }>;
    updateLocation(id: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<{
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
    }>;
}
