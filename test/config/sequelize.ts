import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const sequelizeTestingModuleConfig: SequelizeModuleOptions = {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  autoLoadModels: true,
};
