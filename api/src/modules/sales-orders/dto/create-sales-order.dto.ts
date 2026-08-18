import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SalesOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  orderedQty: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  discountPct?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToLine1?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToPostal?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPoRef?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}
