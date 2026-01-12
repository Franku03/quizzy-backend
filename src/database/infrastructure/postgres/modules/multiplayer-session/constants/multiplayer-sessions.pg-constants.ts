import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const MULTIPLAYER_SESSIONS_POSTGRES_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>= {
    module: 'mutiplayer-sessions',
    databaseType: 'postgresql',
    collectionOrTable: 'multiplayer_sessions',
} as const;