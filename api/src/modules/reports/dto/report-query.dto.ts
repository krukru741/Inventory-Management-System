import { IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Output format (json or csv)' })
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' = 'json';
}

export class DeadStockQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({ description: 'Number of days with no outbound movement', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysThreshold?: number = 30;
}
