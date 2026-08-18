import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShipmentItemDto {
  @ApiProperty()
  @IsUUID()
  soiId: string; // Sales Order Item ID

  @ApiProperty()
  @IsUUID()
  locationId: string; // Specific bin/shelf in the warehouse to pick from

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  shippedQty: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serialNumber?: string;
}

export class ShipOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [ShipmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items: ShipmentItemDto[];
}
