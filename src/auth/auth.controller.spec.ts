import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { Sequelize } from 'sequelize-typescript';
import { UsersService } from '../users/users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeTestingModuleConfig } from '../../test/config/sequelize';
import { User } from '../users/user.model';
import { Product } from '../products/product.model';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordService } from '../password/password.service';
import { JwtModule } from '@nestjs/jwt';
import { mockUserDto } from '../../test/mock-data/users';
import { mock } from 'jest-mock-extended';
import { Request } from 'express';

describe('AuthController', () => {
  let module: TestingModule;
  let memDb: Sequelize;
  let usersService: UsersService;
  let authService: AuthService;
  let authController: AuthController;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot(sequelizeTestingModuleConfig),
        SequelizeModule.forFeature([User, Product]),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get('ACCESS_TOKEN_SECRET'),
            signOptions: {
              expiresIn: '15m',
            },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, ConfigService, UsersService, PasswordService],
    }).compile();

    memDb = module.get(Sequelize);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should dependencies be defined', () => {
    expect(module).toBeDefined();
    expect(memDb).toBeDefined();
    expect(usersService).toBeDefined();
    expect(authService).toBeDefined();
    expect(authController).toBeDefined();
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    it('should login user', async () => {
      const mockRequest = mock<Request>();
      mockRequest.user = {
        id: user.id,
        username: user.username,
      };

      const jwt = await authController.login(mockRequest);
      expect(jwt).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    it('should refresh tokens', async () => {
      const validatedUser = await authService.validateUser(
        user.username,
        mockUserDto.password,
      );
      const { refresh_token } = await authService.validateJwtTokens(
        validatedUser,
      );

      const newJwt = await authController.refreshToken({ refresh_token });
      expect(newJwt).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });
  });
});
