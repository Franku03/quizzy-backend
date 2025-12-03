import { UserRepositoryPostgres } from '../postgres/modules/users/users.repository.postgres';
import { UserRepositoryMongo } from '../mongo/modules/users/users.repository.mongo';
import { Type } from '@nestjs/common';
<<<<<<< HEAD:src/database/infrastructure/repositories/repository.catalog.enum.ts
import { KahootRepositoryMongo } from './mongo/kahoots/kahoots.repository.mongo';
import { KahootRepositoryPostgres } from './postgres/kahoots/kahoots.repository.postgres';
import { GroupRepositoryMongo } from './mongo/groups/groups.repository.mongo';

=======
import { KahootRepositoryMongo } from '../mongo/modules/kahoots/kahoots.repository.mongo';
import { KahootRepositoryPostgres } from '../postgres/modules/kahoots/kahoots.repository.postgres';
>>>>>>> origin/develop:src/database/infrastructure/catalogs/repository.catalog.enum.ts

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