import { UsersService } from './users.service';
import { mockUserDto } from '../../test/mock-data/users';
import { PasswordService } from '../password/password.service';
import { User } from './user.model';
import { Product } from '../products/product.model';
import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeTestingModuleConfig } from '../../test/config/sequelize';
import { Sequelize } from 'sequelize-typescript';

describe('UsersService', () => {
  let module: TestingModule;
  let memDb: Sequelize;
  let usersService: UsersService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot(sequelizeTestingModuleConfig),
        SequelizeModule.forFeature([User, Product]),
      ],
      providers: [UsersService, PasswordService],
    }).compile();

    memDb = module.get(Sequelize);
    usersService = module.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should dependencies be defined', () => {
    expect(module).toBeDefined();
    expect(memDb).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('create', () => {
    afterEach(async () => {
      await memDb.truncate();
    });

    it('should create a user', async () => {
      const newUser = await usersService.create(mockUserDto);

      expect(newUser).toMatchObject({
        id: expect.any(String),
        username: mockUserDto.username,
        password: expect.any(String),
        admin: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw an error when trying to create already existing user', async () => {
      await usersService.create(mockUserDto);
      await expect(usersService.create(mockUserDto)).rejects.toThrow();
    });
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    it('should find a user', async () => {
      const userFound = await usersService.findOne(user.username);
      expect(userFound).toMatchObject({
        id: expect.any(String),
        username: mockUserDto.username,
        password: expect.any(String),
        admin: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should not found a user', async () => {
      const userFound = await usersService.findOne('fulano');
      expect(userFound).toBeFalsy();
    });

    it('should get a user profile', async () => {
      const userProfile = await usersService.profile(user.id);
      expect(userProfile).toMatchObject({
        id: expect.any(String),
        username: mockUserDto.username,
        admin: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(userProfile).toEqual(
        expect.not.objectContaining({ password: expect.any(String) }),
      );
    });

    it('should not found a user profile', async () => {
      const userProfile = await usersService.profile('fulano');
      expect(userProfile).toBeFalsy();
    });

    it('should check if user is admin', async () => {
      const isAdmin = await usersService.isAdmin(user.id);
      expect(isAdmin).toBeFalsy();
    });

    it('should get null when checking if user is admin but it does not exist', async () => {
      const isAdmin = await usersService.isAdmin('fulano');
      expect(isAdmin).toBeNull();
    });
  });
});
