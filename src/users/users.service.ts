import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { PasswordService } from '../password/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private passwordService: PasswordService,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordService.hash(data.password);
    return this.userModel.create({
      username: data.username,
      password: hashedPassword,
    });
  }

  findOne(username: string, attributes?: string[]): Promise<User | null> {
    return this.userModel.findOne({
      where: {
        username,
      },
      attributes,
    });
  }

  async profile(id: string): Promise<UserProfileDto> {
    const user = await this.userModel.findOne({
      where: { id },
      attributes: { exclude: ['password'] },
    });

    return user as UserProfileDto;
  }

  async isAdmin(id: string): Promise<boolean | null> {
    const user = await this.userModel.findOne({
      where: { id },
      attributes: { include: ['admin'] },
    });

    return user ? user.admin : null;
  }
}
