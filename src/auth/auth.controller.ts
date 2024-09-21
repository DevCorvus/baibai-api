import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService, UserInterface } from './auth.service';
import { Request } from 'express';
import { UserLoginDto, RefreshTokenDto, AuthTokensDto } from './auth.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({ type: UserLoginDto })
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    example: new BadRequestException().getResponse(),
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request): Promise<AuthTokensDto> {
    return this.authService.validateJwtTokens(req.user as UserInterface);
  }

  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    example: new BadRequestException().getResponse(),
  })
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto): Promise<AuthTokensDto> {
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
