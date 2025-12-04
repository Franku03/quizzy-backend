import { Type } from '@nestjs/common';
import { UserDaoPostgres } from '../postgres/modules/users/users.dao.postgres';
import { UserDaoMongo } from '../mongo/modules/users/user.dao.mongo';
import { GroupDaoMongo } from '../mongo/modules/groups/groups.dao.mongo'; // De HEAD
import { KahootDaoMongo } from '../mongo/modules/kahoots/kahoots.dao.mongo'; // De Incoming
import { SoloAttemptQueryDaoMongo } from '../mongo/modules/solo-attempts/attempts.dao.mongo'; // De Incoming

export type DaoRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum DaoName {
  User = 'UserDao',
  Group = 'GroupDao',
  Kahoot = 'KahootDao', 
  SoloAttempt = 'SoloAttemptDao',
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
  [DaoName.Group]: {
    typeorm: null,
    mongoose: GroupDaoMongo,
  },
};
