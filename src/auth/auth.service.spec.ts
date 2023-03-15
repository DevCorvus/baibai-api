import { mockUserDto } from './../../test/mock-data/users';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../password/password.service';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeTestingModuleConfig } from '../../test/config/sequelize';
import { User } from '../users/user.model';
import { Product } from '../products/product.model';
import { Sequelize } from 'sequelize-typescript';

describe('AuthService', () => {
  let module: TestingModule;
  let memDb: Sequelize;
  let usersService: UsersService;
  let authService: AuthService;

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
      providers: [AuthService, UsersService, PasswordService],
    }).compile();

    memDb = module.get(Sequelize);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should dependencies be defined', () => {
    expect(memDb).toBeDefined();
    expect(usersService).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    it('should validate user successfully', async () => {
      const validatedUser = await authService.validateUser(
        user.username,
        mockUserDto.password,
      );

      expect(validatedUser).toEqual({
        id: user.id,
        username: user.username,
      });
    });

    it('should generate jwt tokens', async () => {
      const validatedUser = await authService.validateUser(
        user.username,
        mockUserDto.password,
      );

      const jwt = await authService.validateJwtTokens(validatedUser);

      expect(jwt).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    it('should validate refresh token and regenerate jwt tokens', async () => {
      const validatedUser = await authService.validateUser(
        user.username,
        mockUserDto.password,
      );

      const jwt = await authService.validateJwtTokens(validatedUser);
      const newJwt = await authService.validateJwtRefreshToken(
        jwt.refresh_token,
      );

      expect(newJwt).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });
  });
});
