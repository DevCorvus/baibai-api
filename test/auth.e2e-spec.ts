import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Sequelize } from 'sequelize-typescript';
import { UsersService } from '../src/users/users.service';
import { mockUserDto } from './mock-data/users';
import { User } from '../src/users/user.model';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let memDb: Sequelize;
  let httpRequest: request.SuperTest<request.Test>;
  let usersService: UsersService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpRequest = request(app.getHttpServer());
    memDb = moduleFixture.get(Sequelize);
    usersService = moduleFixture.get<UsersService>(UsersService);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await memDb.truncate();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    it('/auth/login (POST)', async () => {
      const res = await httpRequest
        .post('/auth/login')
        .send({ username: user.username, password: mockUserDto.password });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    describe('/auth/login (POST) -> 401 on wrong credentials', () => {
      it('user not found', async () => {
        const res = await httpRequest
          .post('/auth/login')
          .send({ username: 'random', password: mockUserDto.password });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          error: 'Unauthorized',
          message: 'Wrong username or password',
          statusCode: 401,
        });
      });

      it('wrong password', async () => {
        const res = await httpRequest
          .post('/auth/login')
          .send({ username: user.username, password: 'random' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          error: 'Unauthorized',
          message: 'Wrong username or password',
          statusCode: 401,
        });
      });
    });

    it('/auth/refresh (POST)', async () => {
      const validatedUser = await authService.validateUser(
        user.username,
        mockUserDto.password,
      );
      const { refresh_token } = await authService.validateJwtTokens(
        validatedUser,
      );

      const res = await httpRequest
        .post('/auth/refresh')
        .send({ refresh_token });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    it('/auth/refresh (POST) -> 401 on invalid token', async () => {
      const res = await httpRequest
        .post('/auth/refresh')
        .send({ refresh_token: 'random' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });
});
