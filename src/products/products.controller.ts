import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.model';
import { ProductDto } from './product.dto';
import { UserID } from 'src/users/userId.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { COUNTRIES } from '../data/countries';
import { FileInterceptor } from '@nestjs/platform-express';
import { unlink as deleteFile, existsSync as fileExists } from 'fs';
import { Request, Response } from 'express';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_FILE_TYPES = /image\/(jpg|jpeg|png|webp)/;

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

  @Get('preview/:filename')
  findProductPreviewImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!fileExists(`uploads/${filename}`)) throw new NotFoundException();
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
        ],
      }),
    )
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
  @Delete(':productId')
  async delete(
    @UserID() userId: string,
    @Param('productId') productId: string,
  ): Promise<boolean> {
    const product = await this.productsService.findOne(productId);

    if (product) {
      // TODO: Delete product image
      return this.productsService.delete(productId, userId);
    } else {
      return false;
    }
  }
}
