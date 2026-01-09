// src\database\infrastructure\mongo\modules\kahoots\constants\kahoot.mongo-constants.ts
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const MULTIPLAYER_SESSIONS_MONGO_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>= {
    module: 'mutiplayer-sessions',
    databaseType: 'mongodb',
    collectionOrTable: 'multiplayer_sessions',
} as const;