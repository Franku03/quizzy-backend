import { Type } from '@nestjs/common';
import { UserDaoPostgres } from '../postgres/modules/users/users.dao.postgres';
import { UserDaoMongo } from '../mongo/modules/users/user.dao.mongo';
import { KahootDaoMongo } from '../mongo/modules/kahoots/kahoots.dao.mongo';
import { SoloAttemptQueryDaoMongo } from '../mongo/modules/solo-attempts/attempts.dao.mongo';
import { ExploreMongoDao } from '../mongo/modules/explore/explore.dao.mongo';

export type DaoRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum DaoName {
  User = 'UserDao',
  Kahoot = 'KahootDao', 
  SoloAttempt = 'SoloAttemptDao',
  Explore = 'ExploreDao',
}

export const DAO_REGISTRY: Record<DaoName, DaoRegistryItem> = {
  [DaoName.User]: {
    typeorm: UserDaoPostgres,
    mongoose: UserDaoMongo,
  },
  [DaoName.Kahoot]: {
    typeorm: KahootDaoMongo,
    mongoose: KahootDaoMongo,
  },
  [DaoName.SoloAttempt]: {
    typeorm: null,
    mongoose: SoloAttemptQueryDaoMongo,
  },
  [DaoName.Explore]: {
    typeorm: null,
    mongoose: ExploreMongoDao,
  },
};
