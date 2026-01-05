// src\database\infrastructure\helpers\database.error-context.helper.ts
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