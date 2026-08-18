import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLocationDto } from './create-location.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
