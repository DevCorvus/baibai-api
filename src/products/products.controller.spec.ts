import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { Sequelize } from 'sequelize-typescript';
import { COUNTRIES } from '../data/countries';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeTestingModuleConfig } from '../../test/config/sequelize';
import { User } from '../users/user.model';
import { Product } from './product.model';
import { ProductsService } from './products.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../password/password.service';
import {
  mockFilename,
  mockFilenameUpdate,
  mockImageFile,
  mockProductDto,
  mockProductUpdateDto,
} from '../../test/mock-data/products';
import { mockUserDto } from '../../test/mock-data/users';
import { request } from 'express';
import { copyImageIntoUploads } from '../../test/utils/copyImageIntoUploads';
import { existsSync, unlink } from 'fs';
import { resolve } from 'path';

describe('ProductsController', () => {
  let module: TestingModule;
  let memDb: Sequelize;
  let usersService: UsersService;
  let productsService: ProductsService;
  let productsController: ProductsController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot(sequelizeTestingModuleConfig),
        SequelizeModule.forFeature([User, Product]),
      ],
      controllers: [ProductsController],
      providers: [ProductsService, UsersService, PasswordService],
    }).compile();

    memDb = module.get(Sequelize);
    usersService = module.get<UsersService>(UsersService);
    productsService = module.get<ProductsService>(ProductsService);
    productsController = module.get<ProductsController>(ProductsController);
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
    expect(productsController).toBeDefined();
  });

  it('should return all locations', () => {
    const locations = productsController.locations();
    expect(locations).toEqual(COUNTRIES);
  });

  describe('after user created', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    it('should create a product', async () => {
      const mockRequest = request;
      mockRequest['filename'] = mockFilename;

      const product = await productsController.create(
        user.id,
        mockProductDto,
        mockImageFile as Express.Multer.File,
        mockRequest,
      );

      expect(product).toMatchObject({
        id: expect.any(String),
        userId: user.id,
        ...mockProductDto,
        previewImageUrl: mockFilename,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
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

      it('should find all products', async () => {
        const products = await productsController.findAll({});

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('should find all products by search param', async () => {
        const products = await productsController.findAll({
          search: product.name,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('should find all products by username', async () => {
        const products = await productsController.findAll({
          username: user.username,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('should find all products by search param and username', async () => {
        const products = await productsController.findAll({
          search: product.name,
          username: user.username,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        expect(products.some((p) => p.id, product.id)).toBe(true);
      });

      it('should find one product', async () => {
        const foundProduct = await productsController.findOne(product.id);
        expect(foundProduct).toMatchObject({
          id: product.id,
          userId: product.userId,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          quantity: product.quantity,
          status: product.status,
          location: product.location,
          previewImageUrl: product.previewImageUrl,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          user: {
            username: user.username,
            createdAt: user.createdAt,
          },
        });
      });

      describe('requires image file in uploads', () => {
        beforeEach(() => {
          copyImageIntoUploads();
        });

        afterEach(() => {
          const mockImageFilePath = resolve('uploads/test.jpg');
          if (existsSync(mockImageFilePath)) {
            unlink(mockImageFilePath, (err) => {
              if (err) console.error(err);
            });
          }
        });

        it('should update a product', async () => {
          const productUpdated = await productsController.update(
            user.id,
            product.id,
            mockProductUpdateDto,
          );
          expect(productUpdated).toBe(true);

          const updatedProduct = await productsService.findOne(product.id);

          expect(productUpdated).toBe(true);
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

        it('should update a product with image', async () => {
          const mockRequest = request;
          mockRequest['filename'] = mockFilenameUpdate;

          const productUpdated = await productsController.updateWithImage(
            user.id,
            product.id,
            mockProductUpdateDto,
            mockImageFile as Express.Multer.File,
            mockRequest,
          );
          expect(productUpdated).toBe(true);

          const updatedProduct = await productsService.findOne(product.id);

          expect(productUpdated).toBe(true);
          expect(updatedProduct).toMatchObject({
            id: product.id,
            userId: product.userId,
            ...mockProductUpdateDto,
            price: Number(mockProductUpdateDto.price),
            previewImageUrl: mockFilenameUpdate,
            createdAt: product.createdAt,
            updatedAt: expect.any(Date),
            user: {
              username: user.username,
              createdAt: user.createdAt,
            },
          });
        });

        it('should delete a product', async () => {
          const productDeleted = await productsController.delete(
            user.id,
            product.id,
          );

          expect(productDeleted).toBe(true);
        });
      });
    });
  });
});
