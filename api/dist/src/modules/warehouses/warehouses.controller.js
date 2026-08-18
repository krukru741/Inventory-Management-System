"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehousesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const warehouses_service_1 = require("./warehouses.service");
const create_warehouse_dto_1 = require("./dto/create-warehouse.dto");
const update_warehouse_dto_1 = require("./dto/update-warehouse.dto");
const create_location_dto_1 = require("./dto/create-location.dto");
const update_location_dto_1 = require("./dto/update-location.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let WarehousesController = class WarehousesController {
    warehousesService;
    constructor(warehousesService) {
        this.warehousesService = warehousesService;
    }
    create(createWarehouseDto) {
        return this.warehousesService.create(createWarehouseDto);
    }
    findAll(paginationDto) {
        return this.warehousesService.findAll(paginationDto);
    }
    findOne(id) {
        return this.warehousesService.findOne(id);
    }
    update(id, updateWarehouseDto) {
        return this.warehousesService.update(id, updateWarehouseDto);
    }
    remove(id) {
        return this.warehousesService.remove(id);
    }
    findLocations(id) {
        return this.warehousesService.findLocations(id);
    }
    addLocation(id, createLocationDto) {
        return this.warehousesService.addLocation(id, createLocationDto);
    }
    updateLocation(id, locationId, updateLocationDto) {
        return this.warehousesService.updateLocation(id, locationId, updateLocationDto);
    }
};
exports.WarehousesController = WarehousesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new warehouse (Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_warehouse_dto_1.CreateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all warehouses' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a warehouse by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin),
    (0, swagger_1.ApiOperation)({ summary: 'Update a warehouse (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_warehouse_dto_1.UpdateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a warehouse (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/locations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all locations for a warehouse' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findLocations", null);
__decorate([
    (0, common_1.Post)(':id/locations'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager),
    (0, swagger_1.ApiOperation)({ summary: 'Add a location to a warehouse (Admin/Manager only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_location_dto_1.CreateLocationDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "addLocation", null);
__decorate([
    (0, common_1.Patch)(':id/locations/:locationId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager),
    (0, swagger_1.ApiOperation)({ summary: 'Update a location (Admin/Manager only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('locationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "updateLocation", null);
exports.WarehousesController = WarehousesController = __decorate([
    (0, swagger_1.ApiTags)('Warehouses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouses_service_1.WarehousesService])
], WarehousesController);
//# sourceMappingURL=warehouses.controller.js.map