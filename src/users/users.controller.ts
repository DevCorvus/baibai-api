import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserID } from './userId.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() body: UserDto): Promise<true> {
    try {
      await this.usersService.create(body);
      return true;
    } catch (_) {
      throw new ConflictException('User already exists');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@UserID() userId: string) {
    return this.usersService.profile(userId);
  }
}
