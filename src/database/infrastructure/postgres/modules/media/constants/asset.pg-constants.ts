/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\media\constants\asset.pg-constants.ts

import { DatabaseModuleBase } from 'src/core/errors/helpers/database-error-context.helper';

export const ASSET_POSTGRES_BASE: DatabaseModuleBase = {
    module: 'media',
    databaseType: 'postgresql',
    collectionOrTable: 'asset_metadata',
} as const;