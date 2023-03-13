import { UUIDV4 } from 'sequelize';
import {
  Table,
  Model,
  Default,
  PrimaryKey,
  Column,
  IsIn,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../users/user.model';

export const ProductStatus = [
  'new',
  'like-new',
  'refurbished',
  'secondhand',
] as const;
export type ProductStatusType = (typeof ProductStatus)[number];

@Table({ timestamps: true })
export class Product extends Model {
  @Default(UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column
  name: string;

  @Column
  description: string;

  @Column
  price: number;

  @Column
  quantity: number;

  @Column
  previewImageUrl: string;

  @Column
  location: string;

  @IsIn([ProductStatus] as any[])
  @Column
  status: ProductStatusType;

  @ForeignKey(() => User)
  @Column
  userId: string;

  @BelongsTo(() => User)
  user: User;
}
