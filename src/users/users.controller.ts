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
import { User } from './user.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserID } from './userId.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() body: UserDto): Promise<User> {
    try {
      const newUser = await this.usersService.create(body);
      return newUser;
    } catch (_) {
      throw new ConflictException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@UserID() userId: string) {
    return this.usersService.profile(userId);
  }
}
