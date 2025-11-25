import { ModelDefinition } from '@nestjs/mongoose';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

// TypeORM entities
import { KahootEntity as KahootTypeORM } from './postgres/kahoots/kahoots.entity';
import { UserEntity as UserTypeORM } from './postgres/users/users.entity';

// Mongoose schemas
import { KahootMongo, KahootSchema } from './mongo/kahoots/kahoots.schema';
import { UserMongo, UserSchema } from './mongo/users/users.schema';

//Nombres comunes para TypeORM y Mongoose (EXTENSIBLE)
export enum EntityName {
  Kahoot = 'Kahoot',
  User = 'User',
}

type EntityRegistryItem = {
  typeorm: EntityClassOrSchema | null;
  mongoose: ModelDefinition | null;
};

//Mapeo de nombres comunes para entidades de base de datos (EXTENSIBLE)
export const ENTITY_REGISTRY: Record<EntityName, EntityRegistryItem> = {
  [EntityName.Kahoot]: {
    typeorm: KahootTypeORM,
    mongoose: { name: KahootMongo.name, schema: KahootSchema },
  },
  [EntityName.User]: {
    typeorm: UserTypeORM,
    mongoose: { name: UserMongo.name, schema: UserSchema },
  },
};
