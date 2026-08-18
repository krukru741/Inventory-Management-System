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
        name: string;
        code: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        managerId: string | null;
    }>;
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
            id: string;
            name: string;
            code: string;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            postalCode: string | null;
            country: string | null;
            phone: string | null;
            email: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            managerId: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    findAllLocations(): Promise<({
        warehouse: {
            name: string;
        };
    } & {
        id: string;
        name: string | null;
        code: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
    })[]>;
    findOne(id: string): Promise<{
        manager: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        code: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        managerId: string | null;
    }>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<{
        id: string;
        name: string;
        code: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        managerId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        managerId: string | null;
    }>;
    findLocations(id: string): Promise<{
        id: string;
        name: string | null;
        code: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
    }[]>;
    addLocation(id: string, createLocationDto: CreateLocationDto): Promise<{
        id: string;
        name: string | null;
        code: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    updateLocation(id: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<{
        id: string;
        name: string | null;
        code: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        parentId: string | null;
        locationType: string;
        capacity: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
}
