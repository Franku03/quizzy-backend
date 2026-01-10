/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\kahoots\constants\kahoot.mongo-constants.ts

import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export const KAHOOT_MONGO_BASE: Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>= {
    module: 'kahoots',
    databaseType: 'mongodb',
    collectionOrTable: 'kahoots',
} as const;