import { UserRepositoryPostgres } from '../postgres/modules/users/users.repository.postgres';
import { UserRepositoryMongo } from '../mongo/modules/users/users.repository.mongo';
import { Type } from '@nestjs/common';
import { KahootRepositoryMongo } from '../mongo/modules/kahoots/kahoots.repository.mongo';
import { KahootRepositoryPostgres } from '../postgres/modules/kahoots/kahoots.repository.postgres';
import { SoloAttemptRepositoryMongo } from '../mongo/modules/solo-attempts/attempts.repository.mongo';
import { SoloAttemptRepositoryPostgres } from '../postgres/modules/attempts/attempts.repository.postgres';
import { GroupRepositoryMongo } from '../mongo/modules/groups/groups.repository.mongo';

export type RepositoryRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum RepositoryName {
  User = 'UserRepository',
  Kahoot = 'KahootRepository',
  Attempt = 'AttemptRepository',
  Group = 'GroupRepository',
}

export const REPOSITORY_REGISTRY: Record<
  RepositoryName,
  RepositoryRegistryItem
> = {
  [RepositoryName.User]: {
    typeorm: UserRepositoryPostgres,
    mongoose: UserRepositoryMongo,
  },
  [RepositoryName.Kahoot]: {
    typeorm: KahootRepositoryPostgres,
    mongoose: KahootRepositoryMongo,
  },
  [RepositoryName.Attempt]: {
    typeorm: SoloAttemptRepositoryPostgres,
    mongoose: SoloAttemptRepositoryMongo,
  },
  [RepositoryName.Group]: {
    typeorm: null,
    mongoose: GroupRepositoryMongo,
  },
};