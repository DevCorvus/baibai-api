import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockUserDto } from './mock-data/users';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/user.model';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send(mockUserDto)
      .expect(201);
  });

  describe('/users (POST) -> 400 on validation errors', () => {
    it('username not alphanumeric', async () => {
      const res = await request(app.getHttpServer())
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
      const res = await request(app.getHttpServer())
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
      const res = await request(app.getHttpServer())
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
      const res = await request(app.getHttpServer())
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
      const res = await request(app.getHttpServer())
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

  describe('after being authenticated', () => {
    let accessToken: string;

    beforeEach(async () => {
      await usersService.create(mockUserDto);
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockUserDto);

      accessToken = (res.body as { access_token: string }).access_token;
    });

    it('/users/profile (GET)', async () => {
      const res = await request(app.getHttpServer())
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
