/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\context\i-error-database.context.ts

import { IInfrastructureErrorContext } from "./i-error-infraestructure-context.interface";

export interface IDatabaseErrorContext extends IInfrastructureErrorContext {
    databaseType: 'mongodb' | 'postgresql';
    collectionOrTable?: string;
    entityId?: string;
}
