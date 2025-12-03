import { ModelDefinition } from '@nestjs/mongoose';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

// TypeORM entities
import { KahootEntity as KahootTypeORM } from '../postgres/entities/kahoots.entity';
import { UserEntity as UserTypeORM } from '../postgres/entities/users.entity';

// Mongoose schemas
<<<<<<< HEAD:src/database/infrastructure/entities/entity.catalog.enum.ts
import { KahootMongo, KahootSchema } from './mongo/kahoots/kahoots.schema';
import { UserMongo, UserSchema } from './mongo/users/users.schema';
import { GroupMongo, GroupSchema } from './mongo/groups/groups.schema';
=======
import { KahootMongo, KahootSchema } from '../mongo/entities/kahoots.schema';
import { UserMongo, UserSchema } from '../mongo/entities/users.schema';
>>>>>>> origin/develop:src/database/infrastructure/catalogs/entity.catalog.enum.ts

// Catálogo exclusivo de TypeORM (solo clases)
export const TYPEORM_ENTITY_REGISTRY: EntityClassOrSchema[] = [
  KahootTypeORM,
  UserTypeORM,
];

// Catálogo exclusivo de Mongoose (solo definiciones de modelos)
export const MONGOOSE_ENTITY_REGISTRY: ModelDefinition[] = [
  { name: KahootMongo.name, schema: KahootSchema },
  { name: UserMongo.name, schema: UserSchema },
  { name: GroupMongo.name, schema: GroupSchema },
];

