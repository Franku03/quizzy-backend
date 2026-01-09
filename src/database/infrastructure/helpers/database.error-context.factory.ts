/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\helpers\database.error-context.factory.ts

import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

/**
 * Representa los datos fijos del motor y la ubicación del dato.
 */
export type DatabaseModuleBase = Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>;

/**
 * Factory agnóstico para construir contextos de error de persistencia.
 */
export const createDatabaseContext = (
    base: DatabaseModuleBase,
    adapterName: string,
    portName: string,
    operation: string,
    entityId?: string
): IDatabaseErrorContext => ({
    ...base,
    adapterName,
    portName,
    operation,
    entityId,
});