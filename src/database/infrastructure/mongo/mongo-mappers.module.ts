/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\mongo-mappers.module.ts

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