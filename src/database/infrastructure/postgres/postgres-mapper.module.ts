/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\postgres-mapper.module.ts

import { Global, Module } from '@nestjs/common';

// Tokens de Core
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

// Mappers de Postgres
import { PostgresErrorMapper } from './errors/pg-error.mapper';
import { KahootSnapshotPgMapper } from './modules/kahoots/mappers/kahoot.snapshot.pg.mapper';
import { KahootPersistencePgMapper } from './modules/kahoots/mappers/kahoot.snapshot.persitence.pg.mapper';
import { MultiplayerSessionPgMapper } from './modules/multiplayer-session/mappers/session.pg.mapper';
import { KahootUserDetailPgMapper } from './modules/kahoots/mappers/kahoot.user.details.mapper';

@Global()
@Module({
  providers: [
    // 1. Manejo de Errores SQLSTATE
    {
      provide: ERROR_TOKENS.MAPPERS.POSTGRES,
      useClass: PostgresErrorMapper,
    },
    // 2. Persistencia -> App layer
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_SNAPSHOT,
      useClass: KahootSnapshotPgMapper,
    },
    // 3. App layer -> Persistencia
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_PERSISTENCE,
      useClass: KahootPersistencePgMapper,
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.SESSION_REPORT_DETAILS_PG_READ,
      useClass: MultiplayerSessionPgMapper
    },
    {
      provide: APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_USER_DETAIL_PG_READ,
      useClass: KahootUserDetailPgMapper,
    },
  
  ],
  exports: [
    ERROR_TOKENS.MAPPERS.POSTGRES,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_SNAPSHOT,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_PERSISTENCE,
    APPLICATION_CORE_TOKENS.MAPPER.SESSION_REPORT_DETAILS_PG_READ,
    APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_USER_DETAIL_PG_READ,
  ],
})
export class PostgresMappersModule { }