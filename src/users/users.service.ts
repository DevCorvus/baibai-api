import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserDto } from './user.dto';
import { PasswordService } from '../password/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private passwordService: PasswordService,
  ) {}

  async create(data: UserDto): Promise<User> {
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

  profile(id: string): Promise<User> {
    return this.userModel.findOne({
      where: { id },
      attributes: { exclude: ['password'] },
    });
  }

  async isAdmin(id: string): Promise<boolean | null> {
    const user = await this.userModel.findOne({
      where: { id },
      attributes: { include: ['admin'] },
    });

    return user ? user.admin : null;
  }
}
