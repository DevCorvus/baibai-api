import { Product } from '../products/product.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  CreateProductDto,
  ProductDetailsDto,
  ProductDto,
  ProductItemDto,
  ProductListQueryOptionsDto,
} from './product.dto';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { Op, WhereOptions } from 'sequelize';

const displayableProductListAttributes = [
  'id',
  'name',
  'price',
  'quantity',
  'status',
  'previewImageUrl',
  'createdAt',
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product) private productModel: typeof Product,
    private usersService: UsersService,
  ) {}

  async findAll({
    search,
    username,
  }: ProductListQueryOptionsDto): Promise<ProductItemDto[]> {
    const where: WhereOptions<any> = {};

    if (search) where.name = { [Op.like]: `%${search}%` };
    if (username) {
      const user = await this.usersService.findOne(username, ['id']);
      if (user) {
        where.userId = user.id;
      } else {
        return [];
      }
    }

    const products = await this.productModel.findAll({
      where,
      attributes: displayableProductListAttributes,
    });

    return products as ProductItemDto[];
  }

  async findOne(id: string): Promise<ProductDetailsDto | null> {
    const product = await this.productModel.findOne({
      where: { id },
      include: [{ model: User, attributes: ['username', 'createdAt'] }],
    });

    return product as ProductDetailsDto;
  }

  async create(
    userId: string,
    data: CreateProductDto,
    filename: string,
  ): Promise<ProductDto> {
    const product = await this.productModel.create({
      ...data,
      userId,
      previewImageUrl: filename,
    });

    product.price = Number(product.price);
    product.quantity = Number(product.quantity);

    return product as ProductDto;
  }

  async update(
    id: string,
    userId: string,
    data: ProductDto,
    filename?: string,
  ): Promise<boolean> {
    const result = (
      await this.productModel.update(
        { ...data, previewImageUrl: filename },
        { where: { id, userId } },
      )
    )[0];
    return result > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.productModel.destroy({ where: { id, userId } });
    return result > 0;
  }

  async exists(id: string, userId?: string): Promise<boolean> {
    const where: WhereOptions<any> = { id };

    if (userId) where.userId = userId;

    const result = await this.productModel.count({ where });
    return result > 0;
  }
}
