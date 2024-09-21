import { IsJWT, IsNotEmpty } from 'class-validator';

export class UserLoginDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}

export class AuthTokensDto {
  @IsNotEmpty()
  @IsJWT()
  access_token: string;

  @IsNotEmpty()
  @IsJWT()
  refresh_token: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsJWT()
  refresh_token: string;
}
