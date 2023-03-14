import { UsersService } from './users.service';
import { mockUserDto } from '../../test/mock-data/users';
import { PasswordService } from '../password/password.service';
import { User } from './user.model';
import { Sequelize } from 'sequelize-typescript';
import { createMemDb } from '../utils/testing-helpers/createMemDb';
import { Product } from '../products/product.model';

describe('UsersService', () => {
  let usersService: UsersService;
  let memDb: Sequelize;

  beforeAll(async () => {
    memDb = await createMemDb([User, Product]);
    usersService = new UsersService(User, new PasswordService());
  });

  afterAll(() => memDb.close());

  it('should be defined', () => {
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
      });
      expect(new Date(newUser.createdAt).getTime()).not.toBeNaN();
      expect(new Date(newUser.updatedAt).getTime()).not.toBeNaN();
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
      });
      expect(new Date(userFound.createdAt).getTime()).not.toBeNaN();
      expect(new Date(userFound.updatedAt).getTime()).not.toBeNaN();
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
      });
      expect(userProfile).toEqual(
        expect.not.objectContaining({ password: expect.any(String) }),
      );
      expect(new Date(userProfile.createdAt).getTime()).not.toBeNaN();
      expect(new Date(userProfile.updatedAt).getTime()).not.toBeNaN();
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
