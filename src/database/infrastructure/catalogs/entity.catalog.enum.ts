import { ModelDefinition } from '@nestjs/mongoose';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

// TypeORM entities
import { KahootEntity as KahootTypeORM } from '../postgres/entities/kahoots.entity';
import { UserEntity as UserTypeORM } from '../postgres/entities/users.entity';

// Mongoose schemas
import { KahootMongo, KahootSchema } from '../mongo/entities/kahoots.schema';
import { UserMongo, UserSchema } from '../mongo/entities/users.schema';

// Catálogo exclusivo de TypeORM (solo clases)
export const TYPEORM_ENTITY_REGISTRY: EntityClassOrSchema[] = [
  KahootTypeORM,
  UserTypeORM,
];

// Catálogo exclusivo de Mongoose (solo definiciones de modelos)
export const MONGOOSE_ENTITY_REGISTRY: ModelDefinition[] = [
  { name: KahootMongo.name, schema: KahootSchema },
  { name: UserMongo.name, schema: UserSchema },
];
