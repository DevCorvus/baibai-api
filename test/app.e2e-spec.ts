import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpRequest: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpRequest = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/healthcheck (GET)', () => {
    return httpRequest.get('/healthcheck').expect(200);
  });
});
