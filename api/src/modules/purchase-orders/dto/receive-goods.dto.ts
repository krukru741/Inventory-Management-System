import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GoodsReceiptItemDto {
  @ApiProperty()
  @IsUUID()
  poiId: string; // Purchase Order Item ID

  @ApiProperty()
  @IsUUID()
  locationId: string; // Specific bin/shelf in the warehouse

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  receivedQty: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expiryDate?: string; // Should be ISO date string
}

export class ReceiveGoodsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items: GoodsReceiptItemDto[];
}
