import { Type } from '@nestjs/common';
import { UserDaoPostgres } from '../postgres/modules/users/users.dao.postgres';
import { UserDaoMongo } from '../mongo/modules/users/user.dao.mongo';
import { LibraryDaoMongo } from '../mongo/modules/library/library.dao.mongo';
import { KahootDaoMongo } from '../mongo/modules/kahoots/kahoots.dao.mongo';
import { SoloAttemptQueryDaoMongo } from '../mongo/modules/solo-attempts/attempts.dao.mongo';

export type DaoRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum DaoName {
  User = 'UserDao',
  Library = 'LibraryDao',
  // Kahoot = 'KahootDao', ejemplo para kahoot
  Kahoot = 'KahootDao', 
  SoloAttempt = 'SoloAttemptDao',
}

export const DAO_REGISTRY: Record<DaoName, DaoRegistryItem> = {
  [DaoName.User]: {
    typeorm: UserDaoPostgres,
    mongoose: UserDaoMongo,
  },
  [DaoName.Library]: {
    typeorm: null,
    mongoose: LibraryDaoMongo,
  },
  [DaoName.Kahoot]: {
    typeorm: KahootDaoMongo,
    mongoose: KahootDaoMongo,
  },
  [DaoName.SoloAttempt]: {
    typeorm: null,
    mongoose: SoloAttemptQueryDaoMongo,
  },
};
