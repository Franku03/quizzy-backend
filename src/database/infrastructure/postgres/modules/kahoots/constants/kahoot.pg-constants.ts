// src/database/infrastructure/postgres/modules/kahoots/constants/kahoot.postgres-constants.ts
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const KAHOOT_POSTGRES_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'> = {
    module: 'kahoots',
    databaseType: 'postgresql',
    collectionOrTable: 'kahoots', 
} as const;