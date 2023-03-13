import { UUIDV4 } from 'sequelize';
import {
  Table,
  Model,
  Column,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Product } from '../products/product.model';

@Table({ timestamps: true })
export class User extends Model {
  @Default(UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({ unique: true })
  username: string;

  @Column
  password: string;

  @Default(false)
  @Column
  admin: boolean;

  @HasMany(() => Product)
  products: Product[];
}
