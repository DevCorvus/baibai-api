import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.model';
import { ProductDto } from './product.dto';
import { UserID } from 'src/users/userId.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { COUNTRIES } from '../data/countries';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get('locations')
  locations(): string[] {
    return COUNTRIES;
  }

  @Get(':productId')
  async findOne(@Param('productId') productId: string): Promise<Product> {
    const product = await this.productsService.findOne(productId);
    if (product) {
      return product;
    } else {
      throw new NotFoundException('Product not found');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@UserID() userId: string, @Body() body: ProductDto): Promise<Product> {
    return this.productsService.create(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':productId')
  update(
    @UserID() userId: string,
    @Param('productId') productId: string,
    @Body() body: ProductDto,
  ): Promise<boolean> {
    return this.productsService.update(productId, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  delete(
    @UserID() userId: string,
    @Param('productId') productId: string,
  ): Promise<boolean> {
    return this.productsService.delete(productId, userId);
  }
}
