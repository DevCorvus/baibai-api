import {
  Length,
  IsCurrency,
  IsIn,
  IsInt,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductStatusType } from './product.model';
import { COUNTRIES } from '../data/countries';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @Length(2, 100)
  name: string;

  @Length(1, 500)
  @ValidateIf((obj) => obj.description !== '')
  description: string;

  @IsCurrency()
  price: string;

  @IsPositive()
  @IsInt()
  @Type(() => Number)
  quantity: number;

  @IsIn(COUNTRIES)
  location: string;

  @IsIn(ProductStatus)
  status: ProductStatusType;
}

export class CreateProductRequestDto extends CreateProductDto {
  @ApiProperty({ type: String, format: 'binary' })
  image: string;
}

export class ProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  name: string;
  description: string;
  price: number;
  quantity: number;

  @ApiProperty({ enum: COUNTRIES })
  location: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatusType;

  previewImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export class ProductDetailsDto extends ProductDto {
  user: {
    username: string;
    createdAt: string;
  };
}

export class ProductItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  name: string;
  price: number;
  quantity: number;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatusType;

  previewImageUrl: string;
  createdAt: string;
}

export class ProductListQueryOptionsDto {
  search?: string;
  username?: string;
}
