import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessReturnDto {
  @ApiProperty()
  @IsUUID()
  salesOrderId: string;

  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  returnQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty()
  @IsUUID()
  returnToLocationId: string;
}
