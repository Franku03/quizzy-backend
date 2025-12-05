import { UserRepositoryPostgres } from '../postgres/modules/users/users.repository.postgres';
import { UserRepositoryMongo } from '../mongo/modules/users/users.repository.mongo';
import { Type } from '@nestjs/common';
import { KahootRepositoryMongo } from '../mongo/modules/kahoots/kahoots.repository.mongo';
import { KahootRepositoryPostgres } from '../postgres/modules/kahoots/kahoots.repository.postgres';
import { SoloAttemptRepositoryMongo } from '../mongo/modules/solo-attempts/attempts.repository.mongo';
import { SoloAttemptRepositoryPostgres } from '../postgres/modules/attempts/attempts.repository.postgres';
import { FileMetadataMongoRespository } from '../mongo/modules/media/media.repository.mongo';
import { MultiplayerSessionRepository } from '../mongo/modules/multiplayer-session/multiplayer-session.mongo';

export type RepositoryRegistryItem = {
  typeorm: Type<any> | null;
  mongoose: Type<any> | null;
};

export enum RepositoryName {
  User = 'UserRepository',
  Kahoot = 'KahootRepository',
  Attempt = 'AttemptRepository',
  FileMetadata = 'FileMetadataRepository',
  MultiplayerSession = 'MultiplayerSessionRepository',
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
  [RepositoryName.FileMetadata]: {
    typeorm: SoloAttemptRepositoryPostgres,
    mongoose: FileMetadataMongoRespository,
  },
  [RepositoryName.MultiplayerSession]: {
    typeorm: SoloAttemptRepositoryPostgres,
    mongoose: MultiplayerSessionRepository,
  },
};