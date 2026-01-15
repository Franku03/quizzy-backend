/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\helpers\database-error-context.helper.ts

import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export type DatabaseModuleBase = Pick<
  IDatabaseErrorContext,
  'module' | 'databaseType' | 'collectionOrTable'
>;

/**
 * Factory que construye el contexto completo
 */
export const createDatabaseContext = (
  base: DatabaseModuleBase,
  adapterName: string,
  portName: string,
  operation: string,
  entityId?: string,
  extra?: Record<string, unknown>,
): IDatabaseErrorContext => ({
  module: base.module,
  adapterName,
  portName,
  operation,
  ...(extra ?? {}),
  databaseType: base.databaseType,
  collectionOrTable: base.collectionOrTable,
  entityId,
});
