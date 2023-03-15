import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService, UserInterface } from './auth.service';
import { Request } from 'express';
import { RefreshTokenDto } from './refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request) {
    return this.authService.validateJwtTokens(req.user as UserInterface);
  }

  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    try {
      const tokens = await this.authService.validateJwtRefreshToken(
        body.refresh_token,
      );
      return tokens;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
