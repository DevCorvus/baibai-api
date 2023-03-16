import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Sequelize } from 'sequelize-typescript';
import { UsersService } from '../src/users/users.service';
import { mockUserDto } from './mock-data/users';
import { User } from '../src/users/user.model';
import { AuthService } from '../src/auth/auth.service';
import { COUNTRIES } from '../src/data/countries';
import { deleteImageFromUploads } from './utils/deleteImageFromUploads';
import {
  mockFilename,
  mockProductDto,
  mockProductUpdateDto,
} from './mock-data/products';
import { resolve } from 'path';
import { ProductsService } from '../src/products/products.service';
import { Product } from '../src/products/product.model';
import { copyImageIntoUploads } from './utils/copyImageIntoUploads';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let memDb: Sequelize;
  let httpRequest: request.SuperTest<request.Test>;
  let usersService: UsersService;
  let authService: AuthService;
  let productsService: ProductsService;

  const mockImagePath = resolve('test/static/test.jpg');

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
    productsService = moduleFixture.get<ProductsService>(ProductsService);
  });

  afterEach(async () => {
    await memDb.truncate();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products (GET)', async () => {
    const res = await httpRequest.get('/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('/products/locations (GET)', async () => {
    const res = await httpRequest.get('/products/locations');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(COUNTRIES);
  });

  describe('not authenticated yet', () => {
    it('/products (POST) -> 401', async () => {
      const res = await httpRequest.post('/products');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('/products/:productId (PUT) -> 401', async () => {
      const res = await httpRequest.put('/products/random');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('/products/:productId/multipart (PUT) -> 401', async () => {
      const res = await httpRequest.put('/products/random/multipart');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('/products/:productId (DELETE) -> 401', async () => {
      const res = await httpRequest.delete('/products/random');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('after user created and authenticated', () => {
    let user: User;
    let accessToken: string;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);

      const jwt = await authService.validateJwtTokens({
        id: user.id,
        username: user.username,
      });

      accessToken = jwt.access_token;
    });

    it('/products (POST)', async () => {
      const res = await httpRequest
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('name', mockProductDto.name)
        .field('description', mockProductDto.description)
        .field('location', mockProductDto.location)
        .field('price', mockProductDto.price)
        .field('quantity', mockProductDto.quantity)
        .field('status', mockProductDto.status)
        .attach('image', mockImagePath);

      deleteImageFromUploads(res.body.previewImageUrl);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        userId: user.id,
        ...mockProductDto,
        quantity: String(mockProductDto.quantity),
        previewImageUrl: expect.any(String),
      });
      expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
      expect(new Date(res.body.updatedAt).getTime()).not.toBeNaN();
    });

    describe('/products (POST/PUT) and /products/:productId/multipart (PUT) -> 400 on validation errors', () => {
      it('name too short', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', 'a')
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('name too long', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', 'a'.repeat(201))
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('description too long', () => {
        httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', 'a'.repeat(501))
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('location not allowed', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', 'Namek')
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('price not a currency', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', '4.454')
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('quantity not an integer', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', 4.44)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('quantity not a positive integer', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', -4)
          .field('status', mockProductDto.status)
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('status not allowed', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', 'trash')
          .attach('image', mockImagePath)
          .expect(400);
      });

      it('file is not an image', () => {
        const mockDocumentPath = resolve('test/static/test.txt');

        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', mockDocumentPath)
          .expect(400);
      });

      it('file is bigger than 1 MB', () => {
        return httpRequest
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('name', mockProductDto.name)
          .field('description', mockProductDto.description)
          .field('location', mockProductDto.location)
          .field('price', mockProductDto.price)
          .field('quantity', mockProductDto.quantity)
          .field('status', mockProductDto.status)
          .attach('image', Buffer.alloc(1024 * 1024), {
            filename: mockFilename,
            contentType: 'image/jpeg',
          })
          .expect(400);
      });
    });

    describe('after product created', () => {
      let product: Product;

      beforeEach(async () => {
        product = await productsService.create(
          user.id,
          mockProductDto,
          mockFilename,
        );
      });

      it('/products (GET)', async () => {
        const res = await httpRequest.get('/products');

        expect(res.status).toBe(200);

        const products = res.body as Product[];

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('/products (GET) with search param and username', async () => {
        const res = await httpRequest.get(
          `/products?search=${product.name}&username=${user.username}`,
        );

        expect(res.status).toBe(200);

        const products = res.body as Product[];

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('/products/:productId (GET)', async () => {
        const res = await httpRequest.get(`/products/${product.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          id: product.id,
          userId: product.userId,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          quantity: product.quantity,
          status: product.status,
          location: product.location,
          previewImageUrl: product.previewImageUrl,
          user: {
            username: user.username,
          },
        });
        expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
        expect(new Date(res.body.updatedAt).getTime()).not.toBeNaN();
        expect(new Date(res.body.user.createdAt).getTime()).not.toBeNaN();
      });

      it('/products/:productId (GET) -> 404 product not found', async () => {
        const res = await httpRequest.get('/products/random');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
          error: 'Not Found',
          message: 'Product not found',
          statusCode: 404,
        });
      });

      it('/products/:productId (PUT)', async () => {
        const res = await httpRequest
          .put(`/products/${product.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(mockProductUpdateDto);

        expect(res.status).toBe(200);

        const updatedProduct = await productsService.findOne(product.id);

        expect(updatedProduct).toMatchObject({
          id: product.id,
          userId: product.userId,
          ...mockProductUpdateDto,
          price: Number(mockProductUpdateDto.price),
          createdAt: product.createdAt,
          updatedAt: expect.any(Date),
          user: {
            username: user.username,
            createdAt: user.createdAt,
          },
        });
      });

      describe('after image uploaded', () => {
        beforeEach(copyImageIntoUploads);
        afterEach(deleteImageFromUploads);

        it('/products/preview/:filename (GET)', async () => {
          const res = await httpRequest.get(
            `/products/preview/${product.previewImageUrl}`,
          );
          expect(res.status).toBe(200);
          expect(res.get('Content-Type')).toBe('image/jpeg');
        });

        it('/products/:productId/multipart (PUT)', async () => {
          const res = await httpRequest
            .put(`/products/${product.id}/multipart`)
            .set('Authorization', `Bearer ${accessToken}`)
            .field('name', mockProductUpdateDto.name)
            .field('description', mockProductUpdateDto.description)
            .field('location', mockProductUpdateDto.location)
            .field('price', mockProductUpdateDto.price)
            .field('quantity', mockProductUpdateDto.quantity)
            .field('status', mockProductUpdateDto.status)
            .attach('image', mockImagePath);

          expect(res.status).toBe(200);

          const updatedProduct = await productsService.findOne(product.id);

          deleteImageFromUploads(updatedProduct.previewImageUrl);

          expect(updatedProduct).toMatchObject({
            id: product.id,
            userId: product.userId,
            ...mockProductUpdateDto,
            price: Number(mockProductUpdateDto.price),
            createdAt: product.createdAt,
            updatedAt: expect.any(Date),
            user: {
              username: user.username,
              createdAt: user.createdAt,
            },
          });
        });

        it('/products/:productId (DELETE)', async () => {
          const res = await httpRequest
            .delete(`/products/${product.id}`)
            .set('Authorization', `Bearer ${accessToken}`);

          expect(res.status).toBe(200);

          const deletedProduct = await productsService.findOne(product.id);
          expect(deletedProduct).toBe(null);
        });
      });
    });
  });
});
