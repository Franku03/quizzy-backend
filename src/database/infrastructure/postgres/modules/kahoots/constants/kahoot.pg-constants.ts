/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\kahoots\constants\kahoot.pg-constants.ts

import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const KAHOOT_POSTGRES_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'> = {
    module: 'kahoots',
    databaseType: 'postgresql',
    collectionOrTable: 'kahoots', 
} as const;