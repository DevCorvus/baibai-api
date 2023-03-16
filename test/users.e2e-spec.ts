import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockUserDto } from './mock-data/users';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/user.model';
import { Sequelize } from 'sequelize-typescript';
import { AuthService } from '../src/auth/auth.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let httpRequest: request.SuperTest<request.Test>;
  let memDb: Sequelize;
  let usersService: UsersService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
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

  it('/users (POST)', () => {
    return httpRequest.post('/users').send(mockUserDto).expect(201);
  });

  describe('/users (POST) -> 400 on validation errors', () => {
    it('username not alphanumeric', async () => {
      const res = await httpRequest
        .post('/users')
        .send({ username: '<script>', password: mockUserDto.password });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Bad Request',
        message: ['username must contain only letters and numbers'],
        statusCode: 400,
      });
    });

    it('username too long', async () => {
      const res = await httpRequest
        .post('/users')
        .send({ username: 'a'.repeat(101), password: mockUserDto.password });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Bad Request',
        message: ['username must be shorter than or equal to 100 characters'],
        statusCode: 400,
      });
    });

    it('username too short', async () => {
      const res = await httpRequest
        .post('/users')
        .send({ username: 'a'.repeat(3), password: mockUserDto.password });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Bad Request',
        message: ['username must be longer than or equal to 4 characters'],
        statusCode: 400,
      });
    });

    it('password too short', async () => {
      const res = await httpRequest
        .post('/users')
        .send({ username: mockUserDto.username, password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Bad Request',
        message: ['password must be longer than or equal to 6 characters'],
        statusCode: 400,
      });
    });

    it('password too long', async () => {
      const res = await httpRequest
        .post('/users')
        .send({ username: mockUserDto.username, password: 'a'.repeat(251) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Bad Request',
        message: ['password must be shorter than or equal to 250 characters'],
        statusCode: 400,
      });
    });
  });

  describe('not authenticated yet', () => {
    it('/users/profile (GET) -> 401', async () => {
      const res = await httpRequest.get('/users/profile');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('after user created and authenticated', () => {
    let accessToken: string;

    beforeEach(async () => {
      const user = await usersService.create(mockUserDto);
      const jwt = await authService.validateJwtTokens({
        id: user.id,
        username: user.username,
      });

      accessToken = jwt.access_token;
    });

    it('/users/profile (GET)', async () => {
      const res = await httpRequest
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const userProfile = res.body as User;

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
  });
});
