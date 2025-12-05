import { ModelDefinition } from '@nestjs/mongoose';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { GroupMongo, GroupSchema } from '../mongo/entities/groups.schema'; // HEAD

// TypeORM entities
import { KahootEntity as KahootTypeORM } from '../postgres/entities/kahoots.entity';
import { UserEntity as UserTypeORM } from '../postgres/entities/users.entity';
import { AttemptEntity as AttemptTypeORM } from '../postgres/entities/attempt.entity';

// Mongoose schemas
import { KahootMongo, KahootSchema } from '../mongo/entities/kahoots.schema';
import { UserMongo, UserSchema } from '../mongo/entities/users.schema';
import { AttemptMongo, AttemptSchema } from '../mongo/entities/attempts.scheme';

import { FileMetadataMongo, FileMetadataSchema } from '../mongo/entities/media.schema';

// Catálogo exclusivo de TypeORM (solo clases)
export const TYPEORM_ENTITY_REGISTRY: EntityClassOrSchema[] = [
  KahootTypeORM,
  UserTypeORM,
  AttemptTypeORM,
];

// Catálogo exclusivo de Mongoose (solo definiciones de modelos)
export const MONGOOSE_ENTITY_REGISTRY: ModelDefinition[] = [
  { name: KahootMongo.name, schema: KahootSchema },
  { name: UserMongo.name, schema: UserSchema },
  { name: GroupMongo.name, schema: GroupSchema },     // Agregado
  { name: AttemptMongo.name, schema: AttemptSchema }, // Agregado
  { name: AttemptMongo.name, schema: AttemptSchema },
  { name: FileMetadataMongo.name, schema: FileMetadataSchema }
];

