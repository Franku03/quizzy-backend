// src\core\errors\helpers\database-error-context.helper.ts
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

export type DatabaseModuleBase = Pick<IDatabaseErrorContext, 'module' | 'databaseType' | 'collectionOrTable'>;

/**
 * Factory que construye el contexto completo
 */
export const createDatabaseContext = (
    base: DatabaseModuleBase,
    adapterName: string,
    portName: string,
    operation: string,
    entityId?: string,         //  Dinámico: El ID del registro (PK de la tabla)
    extra?: Record<string, any> //  Para el [key: string]: any (Extensibilidad)
): IDatabaseErrorContext => ({
    // Campos de IInfrastructureErrorContext (vía base + params)
    module: base.module,
    adapterName,
    portName,

    // Campos de IErrorContext
    operation,
    ...extra, // Aquí entra cualquier campo extra que quieras meter

    // Campos de IDatabaseErrorContext
    databaseType: base.databaseType,
    collectionOrTable: base.collectionOrTable,
    entityId, // El ID de la fila/documento que falló
});