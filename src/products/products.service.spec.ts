import { UsersService } from '../users/users.service';
import { User } from '../users/user.model';
import { createMemDb } from '../utils/testing-helpers/createMemDb';
import { Product } from './product.model';
import { ProductsService } from './products.service';
import { Sequelize } from 'sequelize-typescript';
import { PasswordService } from '../password/password.service';
import {
  mockProductDto,
  mockProductUpdateDto,
} from '../../test/mock-data/products';
import { mockUserDto } from '../../test/mock-data/users';

describe('ProductsService', () => {
  let usersService: UsersService;
  let productsService: ProductsService;
  let memDb: Sequelize;

  const mockFilename = 'image.jpg';

  beforeAll(async () => {
    memDb = await createMemDb([Product, User]);
    usersService = new UsersService(User, new PasswordService());
    productsService = new ProductsService(Product, usersService);
  });

  afterAll(() => memDb.close());

  it('should be defined', () => {
    expect(productsService).toBeDefined();
  });

  describe('create', () => {
    let user: User;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    it('should create a product', async () => {
      const newProduct = await productsService.create(
        user.id,
        mockProductDto,
        mockFilename,
      );

      expect(newProduct).toMatchObject({
        id: expect.any(String),
        ...mockProductDto,
        previewImageUrl: mockFilename,
        userId: user.id,
      });
      expect(new Date(newProduct.createdAt).getTime()).not.toBeNaN();
      expect(new Date(newProduct.updatedAt).getTime()).not.toBeNaN();
    });
  });

  describe('after product created', () => {
    let user: User;
    let product: Product;

    beforeEach(async () => {
      user = await usersService.create(mockUserDto);
      product = await productsService.create(
        user.id,
        mockProductDto,
        mockFilename,
      );
    });

    afterEach(async () => {
      await memDb.truncate();
    });

    describe('find all', () => {
      it('should find all products', async () => {
        const products = await productsService.findAll({});

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);

        const expectedProduct = products.find((p) => p.id === product.id);

        expect(expectedProduct).toBeTruthy();
        expect(expectedProduct).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
          quantity: expect.any(Number),
          status: expect.any(String),
          previewImageUrl: expect.any(String),
          createdAt: expect.any(Date),
        });
      });

      it('should find all products by search param', async () => {
        const products = await productsService.findAll({
          search: product.name,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);

        const expectedProduct = products.find((p) => p.id === product.id);

        expect(expectedProduct).toBeTruthy();
        expect(expectedProduct.name).toContain(product.name);
      });

      it('should not find any product by search param', async () => {
        const products = await productsService.findAll({ search: 'random' });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(0);
      });

      it('should find all products by username', async () => {
        const products = await productsService.findAll({
          username: user.username,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);

        const expectedProduct = products.find((p) => p.id === product.id);

        expect(expectedProduct).toBeTruthy();
        expect(expectedProduct).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
          quantity: expect.any(Number),
          status: expect.any(String),
          previewImageUrl: expect.any(String),
          createdAt: expect.any(Date),
        });

        const extendedProduct = await productsService.findOne(
          expectedProduct.id,
        );
        expect(extendedProduct.userId).toBe(user.id);
      });

      it('should not find any product by username', async () => {
        const products = await productsService.findAll({ username: 'random' });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(0);
      });

      it('should find all products by search param and username', async () => {
        const products = await productsService.findAll({
          username: user.username,
          search: product.name,
        });

        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);

        const expectedProduct = products.find((p) => p.id === product.id);

        expect(expectedProduct).toBeTruthy();
        expect(expectedProduct.name).toContain(product.name);
      });

      it('should not find any product by search param and username', async () => {
        const p1 = await productsService.findAll({
          search: 'random',
          username: 'random',
        });

        expect(Array.isArray(p1)).toBe(true);
        expect(p1).toHaveLength(0);

        const p2 = await productsService.findAll({
          search: product.name,
          username: 'random',
        });

        expect(Array.isArray(p2)).toBe(true);
        expect(p2).toHaveLength(0);

        const p3 = await productsService.findAll({
          search: 'random',
          username: user.username,
        });

        expect(Array.isArray(p3)).toBe(true);
        expect(p3).toHaveLength(0);
      });
    });

    it('should find one product', async () => {
      const foundProduct = await productsService.findOne(product.id);

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

    it('should not found any product', async () => {
      const foundProduct = await productsService.findOne('random');
      expect(foundProduct).toBeFalsy();
    });

    it('should check if product exists successfully', async () => {
      expect(await productsService.exists(product.id)).toBe(true);
      expect(await productsService.exists(product.id, user.id)).toBe(true);
    });

    it('should check if product does not exist', async () => {
      expect(await productsService.exists('random')).toBe(false);
      expect(await productsService.exists(product.id, 'random')).toBe(false);
      expect(await productsService.exists('random', product.id)).toBe(false);
    });

    it('should update product successfully', async () => {
      const productUpdated1 = await productsService.update(
        product.id,
        user.id,
        mockProductUpdateDto,
        mockFilename,
      );
      const updatedProduct = await productsService.findOne(product.id);

      expect(productUpdated1).toBe(true);
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

      const productUpdated2 = await productsService.update(
        product.id,
        user.id,
        mockProductUpdateDto,
      );

      expect(productUpdated2).toBe(true);
    });

    it('should not update product if it does not exist', async () => {
      const productUpdated1 = await productsService.update(
        'random',
        user.id,
        mockProductUpdateDto,
        mockFilename,
      );

      expect(productUpdated1).toBe(false);

      const productUpdated2 = await productsService.update(
        product.id,
        'random',
        mockProductUpdateDto,
        mockFilename,
      );

      expect(productUpdated2).toBe(false);
    });

    it('should delete product successfully', async () => {
      const productDeleted = await productsService.delete(product.id, user.id);
      expect(productDeleted).toBe(true);
    });

    it('should not delete product if it does not exist', async () => {
      const productDeleted1 = await productsService.delete('random', user.id);
      expect(productDeleted1).toBe(false);

      const productDeleted2 = await productsService.delete(
        product.id,
        'random',
      );
      expect(productDeleted2).toBe(false);
    });
  });
});
