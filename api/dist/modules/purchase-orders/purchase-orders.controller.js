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
exports.PurchaseOrdersController = void 0;
const common_1 = require("@nestjs/common");
const purchase_orders_service_1 = require("./purchase-orders.service");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
const receive_goods_dto_1 = require("./dto/receive-goods.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let PurchaseOrdersController = class PurchaseOrdersController {
    purchaseOrdersService;
    constructor(purchaseOrdersService) {
        this.purchaseOrdersService = purchaseOrdersService;
    }
    create(createPurchaseOrderDto, req) {
        return this.purchaseOrdersService.create(createPurchaseOrderDto, req.user.id);
    }
    findAll() {
        return this.purchaseOrdersService.findAll();
    }
    findOne(id) {
        return this.purchaseOrdersService.findOne(id);
    }
    approve(id, req) {
        return this.purchaseOrdersService.approve(id, req.user.id);
    }
    receiveGoods(id, receiveGoodsDto, req) {
        return this.purchaseOrdersService.receiveGoods(id, receiveGoodsDto, req.user.id);
    }
};
exports.PurchaseOrdersController = PurchaseOrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new purchase order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_order_dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff, client_1.UserRole.viewer),
    (0, swagger_1.ApiOperation)({ summary: 'Get all purchase orders' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff, client_1.UserRole.viewer),
    (0, swagger_1.ApiOperation)({ summary: 'Get a purchase order by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a purchase order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Receive goods against a purchase order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, receive_goods_dto_1.ReceiveGoodsDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "receiveGoods", null);
exports.PurchaseOrdersController = PurchaseOrdersController = __decorate([
    (0, swagger_1.ApiTags)('purchase-orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('purchase-orders'),
    __metadata("design:paramtypes", [purchase_orders_service_1.PurchaseOrdersService])
], PurchaseOrdersController);
//# sourceMappingURL=purchase-orders.controller.js.map