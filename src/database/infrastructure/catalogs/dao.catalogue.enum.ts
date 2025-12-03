import { Type } from '@nestjs/common';
import { UserDaoPostgres } from '../postgres/modules/users/users.dao.postgres';
import { UserDaoMongo } from '../mongo/modules/users/user.dao.mongo';

export type DaoRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum DaoName {
  User = 'UserDao',
  // Kahoot = 'KahootDao', ejemplo para kahoot
}

export const DAO_REGISTRY: Record<DaoName, DaoRegistryItem> = {
  [DaoName.User]: {
    typeorm: UserDaoPostgres,
    mongoose: UserDaoMongo,
  },
  /*
  [DaoName.Kahoot]: {
    typeorm: null,
    mongoose: null,
  },*/
};
