import {
  Length,
  IsCurrency,
  IsIn,
  IsInt,
  IsPositive,
  ValidateIf,
} from 'class-validator';
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

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsIn(COUNTRIES)
  location: string;

  @IsIn(ProductStatus)
  status: ProductStatusType;
}
