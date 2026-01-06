import { Global, Module } from '@nestjs/common';

// Tokens de Core
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

import { MongoErrorMapper } from './errors/mongo-error.mapper';
import { KahootReadMapper } from './modules/kahoots/mappers/kahoot.handler.mapper';

@Global()
@Module({
  providers: [
    {
      provide: ERROR_TOKENS.MAPPERS.MONGO,
      useClass: MongoErrorMapper,
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_READ,
      useClass: KahootReadMapper,
    },
  ],
  exports: [
    ERROR_TOKENS.MAPPERS.MONGO,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_READ,
  ],
})
export class MongoMappersModule {}