import { Product } from 'src/products/product.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductDto } from './product.dto';
import { User } from 'src/users/user.model';

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
  constructor(@InjectModel(Product) private productModel: typeof Product) {}

  findAll(): Promise<Product[]> {
    return this.productModel.findAll({
      attributes: displayableProductListAttributes,
    });
  }

  findAllFromUser(userId: string): Promise<Product[]> {
    return this.productModel.findAll({
      where: { userId },
      attributes: displayableProductListAttributes,
    });
  }

  findOne(id: string): Promise<Product | null> {
    return this.productModel.findOne({
      where: { id },
      include: [{ model: User, attributes: ['username', 'createdAt'] }],
    });
  }

  create(userId: string, data: ProductDto, filename: string): Promise<Product> {
    return this.productModel.create({
      ...data,
      userId,
      previewImageUrl: filename,
    });
  }

  async update(id: string, userId: string, data: ProductDto): Promise<boolean> {
    const result = (
      await this.productModel.update(data, { where: { id, userId } })
    )[0];
    return result > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.productModel.destroy({ where: { id, userId } });
    return result > 0;
  }

  async exists(id: string, userId?: string): Promise<boolean> {
    const result = await this.productModel.count({ where: { id, userId } });
    return result > 0;
  }
}
