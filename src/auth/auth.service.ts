import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from '../password/password.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
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

  async validateJwtToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
