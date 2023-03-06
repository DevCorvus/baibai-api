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

export class ProductDto {
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
