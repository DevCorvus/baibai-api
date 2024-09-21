import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../password/password.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthTokensDto } from './auth.dto';

export interface UserInterface {
  id: string;
  username: string;
}

export interface JwtPayload {
  username: string;
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserInterface | null> {
    const user = await this.usersService.findOne(username);
    if (!user) return null;

    const passwordsDoMatch = await this.passwordService.compare(
      password,
      user.password,
    );
    if (!passwordsDoMatch) return null;

    return {
      id: user.id,
      username: user.username,
    };
  }

  async validateJwtTokens(user: UserInterface) {
    return this.generateTokens({ username: user.username, sub: user.id });
  }

  async validateJwtRefreshToken(refreshToken: string) {
    const decoded = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    return this.generateTokens({
      username: decoded.username,
      sub: decoded.sub,
    });
  }

  private generateTokens(payload: JwtPayload): AuthTokensDto {
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: '1d',
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      }),
    };
  }
}
