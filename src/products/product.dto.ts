import { Length, IsCurrency, IsIn, IsInt } from 'class-validator';
import { ProductStatus, ProductStatusType } from './product.model';

// TODO: Get countries dinamically
const countries: string[] = ['United States'];

export class ProductDto {
  @Length(2, 100)
  name: string;

  @Length(1, 500)
  description: string;

  @IsCurrency()
  price: string;

  @IsInt()
  quantity: number;

  @IsIn(countries)
  location: string;

  @IsIn(ProductStatus)
  status: ProductStatusType;
}
