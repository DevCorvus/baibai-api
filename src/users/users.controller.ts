import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserID } from './userId.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiBadRequestResponse({
    type: BadRequestException,
    example: new BadRequestException().getResponse(),
  })
  @ApiConflictResponse({
    type: ConflictException,
    example: new ConflictException('User already exists').getResponse(),
  })
  @Post()
  async create(@Body() body: CreateUserDto): Promise<true> {
    try {
      await this.usersService.create(body);
      return true;
    } catch (_) {
      throw new ConflictException('User already exists');
    }
  }

  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@UserID() userId: string): Promise<UserProfileDto> {
    return this.usersService.profile(userId);
  }
}
