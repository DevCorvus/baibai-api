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

  findOne(username: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        username,
      },
    });
  }
}
