import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValuationMethod } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-12345' })
  @IsString()
  sku!: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ default: 'each' })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcodeType?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellPrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStockLevel?: number;

  @ApiPropertyOptional({ enum: ValuationMethod, default: ValuationMethod.weighted_average })
  @IsEnum(ValuationMethod)
  @IsOptional()
  valuationMethod?: ValuationMethod;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  lengthCm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  widthCm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  heightCm?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  trackSerial?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  trackBatch?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  trackExpiry?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasVariants?: boolean;
}
