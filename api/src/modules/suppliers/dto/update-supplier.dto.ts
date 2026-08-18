import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSupplierDto } from './create-supplier.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
