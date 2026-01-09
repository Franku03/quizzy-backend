// src/database/infrastructure/mongo/mongo-mappers.module.ts (o la ruta de tu módulo)

import { Global, Module } from '@nestjs/common';

// Tokens de Core
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

// Mappers
import { MongoErrorMapper } from './errors/mongo-error.mapper';
import { KahootReadMapper } from './modules/kahoots/mappers/kahoot.handler.mapper';
// IMPORTA EL NUEVO MAPPER
import { KahootUserDetailMapper } from './modules/kahoots/mappers/kahoot.user.details.mapper'; 

@Global()
@Module({
  providers: [
    {
      provide: ERROR_TOKENS.MAPPERS.MONGO,
      useClass: MongoErrorMapper,
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_MONGO_SNAPSHOT,
      useClass: KahootReadMapper,
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_USER_DETAIL_MONGO_READ,
      useClass: KahootUserDetailMapper,
    },
  ],
  exports: [
    ERROR_TOKENS.MAPPERS.MONGO,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_MONGO_SNAPSHOT,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_USER_DETAIL_MONGO_READ,
  ],
})
export class MongoMappersModule {}