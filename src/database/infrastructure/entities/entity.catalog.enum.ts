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

// Catálogo exclusivo de TypeORM
export const TYPEORM_ENTITY_REGISTRY: Record<
  EntityName,
  EntityClassOrSchema | null
> = {
  [EntityName.Kahoot]: KahootTypeORM,
  [EntityName.User]: UserTypeORM,
};

// Catálogo exclusivo de Mongoose
export const MONGOOSE_ENTITY_REGISTRY: Record<
  EntityName,
  ModelDefinition | null
> = {
  [EntityName.Kahoot]: { name: KahootMongo.name, schema: KahootSchema },
  [EntityName.User]: { name: UserMongo.name, schema: UserSchema },
};
