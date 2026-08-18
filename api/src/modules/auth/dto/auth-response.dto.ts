import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  expiresIn!: string;

  @ApiProperty()
  user!: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}
