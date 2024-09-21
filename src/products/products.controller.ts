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
  UseFilters,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateProductRequestDto,
  ProductDetailsDto,
  ProductDto,
  ProductItemDto,
  ProductListQueryOptionsDto,
} from './product.dto';
import { UserID } from '../users/userId.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { COUNTRIES } from '../data/countries';
import { FileInterceptor } from '@nestjs/platform-express';
import { unlink, existsSync as fileExists } from 'fs';
import { Request, Response } from 'express';
import { UploadedProductImage } from './product-image-upload.decorator';
import { resolve } from 'path';
import { ProductValidationExceptionFilter } from './product-validation-exception.filter';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

function deleteFile(path: string) {
  unlink(path, (err) => {
    if (err) console.error(err);
  });
}

const productSchema: SchemaObject = {
  type: 'string',
  format: 'binary',
  description: 'Product image file',
};

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query() queries: ProductListQueryOptionsDto,
  ): Promise<ProductItemDto[]> {
    return this.productsService.findAll(queries);
  }

  @Get('locations')
  locations(): string[] {
    return COUNTRIES;
  }

  @ApiOkResponse({
    content: {
      'image/png': { schema: productSchema },
      'image/jpeg': { schema: productSchema },
      'image/webp': { schema: productSchema },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    example: new NotFoundException().getResponse(),
  })
  @Get('preview/:filename')
  findProductPreviewImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!fileExists(resolve('uploads', filename))) {
      throw new NotFoundException();
    }
    res.sendFile(filename, { root: 'uploads' });
  }

  @ApiNotFoundResponse({
    type: NotFoundException,
    example: new NotFoundException('Product not found').getResponse(),
  })
  @Get(':productId')
  async findOne(
    @Param('productId') productId: string,
  ): Promise<ProductDetailsDto> {
    const product = await this.productsService.findOne(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductRequestDto })
  @UseGuards(JwtAuthGuard)
  @UseFilters(ProductValidationExceptionFilter)
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  async create(
    @UserID() userId: string,
    @Body() body: CreateProductDto,
    @UploadedProductImage()
    image: Express.Multer.File,
    @Req() req: Request,
  ): Promise<ProductDto> {
    try {
      const newProduct = await this.productsService.create(
        userId,
        body,
        req['filename'],
      );
      return newProduct;
    } catch (error) {
      deleteFile(image.path);
      throw error;
    }
  }

  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    example: new NotFoundException('Product not found').getResponse(),
  })
  @UseGuards(JwtAuthGuard)
  @Put(':productId')
  async update(
    @UserID() userId: string,
    @Param('productId') productId: string,
    @Body() body: ProductDto,
  ): Promise<boolean> {
    const productExists = await this.productsService.exists(productId, userId);

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    return this.productsService.update(productId, userId, body);
  }

  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    example: new NotFoundException('Product not found').getResponse(),
  })
  @UseGuards(JwtAuthGuard)
  @UseFilters(ProductValidationExceptionFilter)
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

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const updated = await this.productsService.update(
        productId,
        userId,
        body,
        req['filename'],
      );

      if (updated) {
        const previousImagePath = resolve('uploads', product.previewImageUrl);
        deleteFile(previousImagePath);
      }

      return updated;
    } catch (error) {
      deleteFile(image.path);
      throw error;
    }
  }

  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    example: new UnauthorizedException().getResponse(),
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    example: new NotFoundException('Product not found').getResponse(),
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  async delete(
    @UserID() userId: string,
    @Param('productId') productId: string,
  ): Promise<boolean> {
    const product = await this.productsService.findOne(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const deleted = await this.productsService.delete(productId, userId);

    if (deleted) {
      const imagePath = resolve('uploads', product.previewImageUrl);
      deleteFile(imagePath);
    }

    return deleted;
  }
}
