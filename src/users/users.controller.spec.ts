import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { mockUserDto } from '../../test/mock-data/users';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeTestingModuleConfig } from '../../test/config/sequelize';
import { User } from './user.model';
import { Product } from '../products/product.model';
import { PasswordService } from '../password/password.service';
import { Sequelize } from 'sequelize-typescript';

describe('UsersController', () => {
  let module: TestingModule;
  let memDb: Sequelize;
  let usersService: UsersService;
  let usersController: UsersController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot(sequelizeTestingModuleConfig),
        SequelizeModule.forFeature([User, Product]),
      ],
      controllers: [UsersController],
      providers: [UsersService, PasswordService],
    }).compile();

    memDb = module.get(Sequelize);
    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
  });

  afterEach(async () => {
    await memDb.truncate();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should dependencies be defined', () => {
    expect(module).toBeDefined();
    expect(memDb).toBeDefined();
    expect(usersService).toBeDefined();
    expect(usersController).toBeDefined();
  });

  it('should create a user', async () => {
    const result = await usersController.create(mockUserDto);
    expect(result).toBe(true);
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    it('should get user profile', async () => {
      const userProfile = await usersController.profile(user.id);

      expect(userProfile).toMatchObject({
        id: user.id,
        username: user.username,
        admin: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });
  });
});
