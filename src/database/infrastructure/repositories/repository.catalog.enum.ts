import { UserRepositoryPostgres } from './postgres/users/users.repository.postgres';
import { UserRepositoryMongo } from './mongo/users/users.repository.mongo';
import { Type } from '@nestjs/common';
import { KahootRepositoryMongo } from './mongo/kahoots/kahoots.repository.mongo';
import { KahootRepositoryPostgres } from './postgres/kahoots/kahoots.repository.postgres';
import { GroupRepositoryMongo } from './mongo/groups/groups.repository.mongo';


export type RepositoryRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum RepositoryName {
  User = 'UserRepository',
  Kahoot = 'KahootRepository',
  Group = 'GroupRepository',
}

export const REPOSITORY_REGISTRY: Record<
  RepositoryName,
  RepositoryRegistryItem
> = {
  [RepositoryName.User]: {
    typeorm: null,
    mongoose: UserRepositoryMongo,
  },
  [RepositoryName.Kahoot]: {
    typeorm: KahootRepositoryPostgres,
    mongoose: KahootRepositoryMongo,
  },
  [RepositoryName.Group]: {
    typeorm: null,
    mongoose: GroupRepositoryMongo,
  },
};