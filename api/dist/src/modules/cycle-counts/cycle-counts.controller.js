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
exports.CycleCountsController = void 0;
const common_1 = require("@nestjs/common");
const cycle_counts_service_1 = require("./cycle-counts.service");
const cycle_count_dto_1 = require("./dto/cycle-count.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let CycleCountsController = class CycleCountsController {
    cycleCountsService;
    constructor(cycleCountsService) {
        this.cycleCountsService = cycleCountsService;
    }
    create(createDto, req) {
        return this.cycleCountsService.create(createDto, req.user.sub);
    }
    countItem(id, locationId, productId, countDto, req) {
        return this.cycleCountsService.countItem(id, locationId, productId, countDto, req.user.sub);
    }
    postAdjustments(id, req) {
        return this.cycleCountsService.postAdjustments(id, req.user.sub);
    }
};
exports.CycleCountsController = CycleCountsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new cycle count draft' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cycle_count_dto_1.CreateCycleCountDto, Object]),
    __metadata("design:returntype", void 0)
], CycleCountsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/locations/:locationId/products/:productId/count'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager, client_1.UserRole.staff),
    (0, swagger_1.ApiOperation)({ summary: 'Record counted quantity for an item' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('locationId')),
    __param(2, (0, common_1.Param)('productId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, cycle_count_dto_1.CountItemDto, Object]),
    __metadata("design:returntype", void 0)
], CycleCountsController.prototype, "countItem", null);
__decorate([
    (0, common_1.Post)(':id/post-adjustments'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.admin, client_1.UserRole.manager),
    (0, swagger_1.ApiOperation)({ summary: 'Post stock adjustments based on count discrepancies' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CycleCountsController.prototype, "postAdjustments", null);
exports.CycleCountsController = CycleCountsController = __decorate([
    (0, swagger_1.ApiTags)('cycle-counts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('cycle-counts'),
    __metadata("design:paramtypes", [cycle_counts_service_1.CycleCountsService])
], CycleCountsController);
//# sourceMappingURL=cycle-counts.controller.js.map