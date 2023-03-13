import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FindAllInterface, ProductsService } from './products.service';
import { Product } from './product.model';
import { ProductDto } from './product.dto';
import { UserID } from '../users/userId.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { COUNTRIES } from '../data/countries';
import { FileInterceptor } from '@nestjs/platform-express';
import { unlink as deleteFile, existsSync as fileExists } from 'fs';
import { Request, Response } from 'express';
import { UploadedProductImage } from './product-image-upload.decorator';
import * as path from 'path';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query() queries: FindAllInterface): Promise<Product[]> {
    return this.productsService.findAll(queries);
  }

  @Get('locations')
  locations(): string[] {
    return COUNTRIES;
  }

  @Get('preview/:filename')
  findProductPreviewImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!fileExists(path.resolve('uploads', filename))) {
      throw new NotFoundException();
    }
    res.sendFile(filename, { root: 'uploads' });
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
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  async create(
    @UserID() userId: string,
    @Body() body: ProductDto,
    @UploadedProductImage()
    image: Express.Multer.File,
    @Req() req: Request,
  ): Promise<Product> {
    try {
      const newProduct = await this.productsService.create(
        userId,
        body,
        req['filename'],
      );
      return newProduct;
    } catch (error) {
      deleteFile(image.path, console.error);
      throw error;
    }
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
  @UseInterceptors(FileInterceptor('image'))
  @Put(':productId/multipart')
  async updateWithImage(
    @UserID() userId: string,
    @Param('productId') productId: string,
    @Body() body: ProductDto,
    @UploadedProductImage()
    image: Express.Multer.File,
    @Req() req: Request,
  ): Promise<boolean> {
    try {
      const product = await this.productsService.findOne(productId);

      if (product) {
        const updated = await this.productsService.update(
          productId,
          userId,
          body,
          req['filename'],
        );

        if (updated) {
          const previousImagePath = path.resolve(
            'uploads',
            product.previewImageUrl,
          );
          deleteFile(previousImagePath, console.error);
        }

        return updated;
      } else {
        return false;
      }
    } catch (error) {
      deleteFile(image.path, console.error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  async delete(
    @UserID() userId: string,
    @Param('productId') productId: string,
  ): Promise<boolean> {
    const product = await this.productsService.findOne(productId);

    if (product) {
      const deleted = await this.productsService.delete(productId, userId);

      if (deleted) {
        const imagePath = path.resolve('uploads', product.previewImageUrl);
        deleteFile(imagePath, console.error);
      }

      return deleted;
    } else {
      return false;
    }
  }
}
