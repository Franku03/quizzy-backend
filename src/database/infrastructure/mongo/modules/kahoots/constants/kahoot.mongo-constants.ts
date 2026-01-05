// src\database\infrastructure\mongo\modules\kahoots\constants\kahoot.mongo-constants.ts
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const KAHOOT_MONGO_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>= {
    module: 'kahoots',
    databaseType: 'mongodb',
    collectionOrTable: 'kahoots',
} as const;