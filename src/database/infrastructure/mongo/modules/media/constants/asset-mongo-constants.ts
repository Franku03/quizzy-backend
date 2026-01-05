// src\database\infrastructure\mongo\modules\media\constants
import { DatabaseModuleBase } from 'src/core/errors/helpers/database-error-context.helper';

export const ASSET_MONGO_BASE: DatabaseModuleBase = {
    module: 'media',
    databaseType: 'mongodb',
    collectionOrTable: 'asset_metadata',
} as const;