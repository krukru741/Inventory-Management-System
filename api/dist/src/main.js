"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.enableCors(configService.get('app.cors'));
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const apiPrefix = configService.get('app.apiPrefix', 'api');
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaClientExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    if (configService.get('app.nodeEnv') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Inventory Management API')
            .setDescription('API for managing inventory, orders, and stock movements')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    }
    app.enableShutdownHooks();
    const port = configService.get('app.port', 3000);
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}/${apiPrefix}`);
}
bootstrap();
//# sourceMappingURL=main.js.map