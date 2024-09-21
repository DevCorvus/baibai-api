import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, Length } from 'class-validator';

export class CreateUserDto {
  @IsAlphanumeric()
  @Length(4, 100)
  username: string;

  @Length(6, 250)
  password: string;
}

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  username: string;

  @ApiProperty({ default: false })
  admin: boolean;

  createdAt: string;
  updatedAt: string;
}
