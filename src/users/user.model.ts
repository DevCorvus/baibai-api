import {
  Table,
  Model,
  Column,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  username: string;

  @Column
  password: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
