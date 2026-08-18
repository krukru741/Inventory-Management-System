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
exports.SalesOrdersController = void 0;
const common_1 = require("@nestjs/common");
const sales_orders_service_1 = require("./sales-orders.service");
const create_sales_order_dto_1 = require("./dto/create-sales-order.dto");
const ship_order_dto_1 = require("./dto/ship-order.dto");
const process_return_dto_1 = require("./dto/process-return.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let SalesOrdersController = class SalesOrdersController {
    salesOrdersService;
    constructor(salesOrdersService) {
        this.salesOrdersService = salesOrdersService;
    }
    processReturn(returnDto, req) {
        return this.salesOrdersService.processReturn(returnDto, req.user.sub);
    }
    create(createSalesOrderDto, req) {
        return this.salesOrdersService.create(createSalesOrderDto, req.user.id);
    }
    findAll() {
        return this.salesOrdersService.findAll();
    }
    findOne(id) {
        return this.salesOrdersService.findOne(id);
    }
    confirm(id) {
        return this.salesOrdersService.confirm(id);
    }
    shipOrder(id, shipOrderDto, req) {
        return this.salesOrdersService.shipOrder(id, shipOrderDto, req.user.id);
    }
};
exports.SalesOrdersController = SalesOrdersController;
__decorate([
    (0, common_1.Post)('returns'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Process a return for a sales order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [process_return_dto_1.ProcessReturnDto, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "processReturn", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new sales order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sales_order_dto_1.CreateSalesOrderDto, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff, client_1.UserRole.viewer),
    (0, swagger_1.ApiOperation)({ summary: 'Get all sales orders' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff, client_1.UserRole.viewer),
    (0, swagger_1.ApiOperation)({ summary: 'Get a sales order by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a sales order' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Ship a sales order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ship_order_dto_1.ShipOrderDto, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "shipOrder", null);
exports.SalesOrdersController = SalesOrdersController = __decorate([
    (0, swagger_1.ApiTags)('sales-orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('sales-orders'),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService])
], SalesOrdersController);
//# sourceMappingURL=sales-orders.controller.js.map