import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
