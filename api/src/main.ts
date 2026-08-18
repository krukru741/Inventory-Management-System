import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors(configService.get('app.cors'));

  // Logging
  app.useLogger(app.get(Logger));

  // Global Prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filters & Interceptors
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Inventory Management API')
      .setDescription('API for managing inventory, orders, and stock movements')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Graceful shutdown hooks for Prisma
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}/${apiPrefix}`);
}
bootstrap();
