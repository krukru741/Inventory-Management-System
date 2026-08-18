import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWarehouseDto } from './create-warehouse.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
