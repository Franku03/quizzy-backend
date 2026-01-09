// src/database/infrastructure/postgres/modules/media/constants/asset.postgres-constants.ts
import { DatabaseModuleBase } from 'src/core/errors/helpers/database-error-context.helper';

export const ASSET_POSTGRES_BASE: DatabaseModuleBase = {
    module: 'media',
    databaseType: 'postgresql',
    collectionOrTable: 'asset_metadata',
} as const;