import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parse } from 'json2csv';
import { Response } from 'express';

@Injectable()
export class CsvInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    const format = request.query.format;

    return next.handle().pipe(
      map(data => {
        if (format === 'csv') {
          // If the data is paginated or wrapped, extract the array
          const rawData = data?.data || data;
          const arrayData = Array.isArray(rawData) ? rawData : [rawData];

          if (arrayData.length === 0) {
            response.header('Content-Type', 'text/csv');
            response.header('Content-Disposition', 'attachment; filename=report.csv');
            return '';
          }

          try {
            const csv = parse(arrayData);
            response.header('Content-Type', 'text/csv');
            response.header('Content-Disposition', 'attachment; filename=report.csv');
            return csv;
          } catch (err) {
            return data;
          }
        }
        return data; // proceed normally for json
      }),
    );
  }
}
