import { IsAlphanumeric, Length } from 'class-validator';

export class UserDto {
  @IsAlphanumeric()
  @Length(4, 100)
  username: string;

  @Length(6, 250)
  password: string;
}
