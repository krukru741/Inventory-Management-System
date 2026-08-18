import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on field(s): ${exception.meta?.target}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = `Foreign key constraint failed: ${exception.meta?.field_name}`;
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Prisma Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
