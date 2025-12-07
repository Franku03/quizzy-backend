// src/database/infrastructure/errors/postgres/postgres-error-factory.ts
import { PostgresError } from './postgres-error';
import { RepositoryErrorSubCategory } from '../repository-error-sub-category.enum';
import { RepositoryErrorContext } from '../repository-error-context.interface';

export class PostgresErrorFactory {
  private static readonly ERROR_MAP: Record<string, RepositoryErrorSubCategory> = {
    // Class 23 — Integrity Constraint Violation
    '23000': RepositoryErrorSubCategory.CONSTRAINT,
    '23001': RepositoryErrorSubCategory.CONSTRAINT,
    '23502': RepositoryErrorSubCategory.VALIDATION,
    '23503': RepositoryErrorSubCategory.CONSTRAINT,
    '23505': RepositoryErrorSubCategory.DUPLICATE_KEY,
    '23514': RepositoryErrorSubCategory.CONSTRAINT,
    '23P01': RepositoryErrorSubCategory.CONSTRAINT,
    
    // Class 22 — Data Exception
    '22000': RepositoryErrorSubCategory.VALIDATION,
    '22001': RepositoryErrorSubCategory.VALIDATION,
    '22003': RepositoryErrorSubCategory.VALIDATION,
    '22004': RepositoryErrorSubCategory.VALIDATION,
    '22007': RepositoryErrorSubCategory.VALIDATION,
    '22008': RepositoryErrorSubCategory.VALIDATION,
    '22012': RepositoryErrorSubCategory.VALIDATION,
    '22023': RepositoryErrorSubCategory.VALIDATION,
    
    // Class 28 — Invalid Authorization Specification
    '28000': RepositoryErrorSubCategory.PERMISSION,
    '28P01': RepositoryErrorSubCategory.PERMISSION,
    '42501': RepositoryErrorSubCategory.PERMISSION,
    
    // Class 3D — Invalid Catalog Name
    '3D000': RepositoryErrorSubCategory.NOT_FOUND,
    '3F000': RepositoryErrorSubCategory.NOT_FOUND,
    
    // Class 42 — Syntax Error or Access Rule Violation
    '42601': RepositoryErrorSubCategory.QUERY_SYNTAX,
    '42883': RepositoryErrorSubCategory.QUERY_SYNTAX,
    '42P01': RepositoryErrorSubCategory.NOT_FOUND, // undefined table
    '42704': RepositoryErrorSubCategory.NOT_FOUND, // undefined object
    
    // Class 40 — Transaction Rollback
    '40000': RepositoryErrorSubCategory.TRANSACTION,
    '40001': RepositoryErrorSubCategory.LOCK,
    '40002': RepositoryErrorSubCategory.CONSTRAINT,
    '40003': RepositoryErrorSubCategory.LOCK,
    '40P01': RepositoryErrorSubCategory.LOCK,
    
    // Class 53 — Insufficient Resources
    '53000': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '53100': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '53200': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '53300': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '53400': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    
    // Class 54 — Program Limit Exceeded
    '54000': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '54001': RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    '54011': RepositoryErrorSubCategory.TIMEOUT,
    '54023': RepositoryErrorSubCategory.TIMEOUT,
    
    // Class 08 — Connection Exception
    '08000': RepositoryErrorSubCategory.CONNECTION,
    '08001': RepositoryErrorSubCategory.CONNECTION,
    '08003': RepositoryErrorSubCategory.CONNECTION,
    '08004': RepositoryErrorSubCategory.CONNECTION,
    '08006': RepositoryErrorSubCategory.CONNECTION,
    '08007': RepositoryErrorSubCategory.LOCK,
    '08P01': RepositoryErrorSubCategory.CONNECTION,
    
    // Class 57 — Operator Intervention
    '57000': RepositoryErrorSubCategory.CONNECTION,
    '57014': RepositoryErrorSubCategory.TIMEOUT,
    '57P01': RepositoryErrorSubCategory.CONNECTION,
    '57P02': RepositoryErrorSubCategory.CONNECTION,
    '57P03': RepositoryErrorSubCategory.CONFIGURATION,
    
    // Class 58 — System Error
    '58000': RepositoryErrorSubCategory.CONNECTION,
    '58030': RepositoryErrorSubCategory.CONNECTION,
    
    // Class 55 — Object Not In Prerequisite State
    '55000': RepositoryErrorSubCategory.CONFIGURATION,
    '55006': RepositoryErrorSubCategory.CONFIGURATION,
    
    // Class F0 — Configuration File Error
    'F0000': RepositoryErrorSubCategory.CONFIGURATION,
    'F0001': RepositoryErrorSubCategory.CONFIGURATION,
    
    // Class XX — Internal Error
    'XX000': RepositoryErrorSubCategory.CONNECTION,
    'XX001': RepositoryErrorSubCategory.CONNECTION,
    'XX002': RepositoryErrorSubCategory.CONNECTION,
    
    // Class P0 — PL/pgSQL Error
    'P0000': RepositoryErrorSubCategory.QUERY_SYNTAX,
    'P0001': RepositoryErrorSubCategory.QUERY_SYNTAX,
  };

  static fromPostgresError(error: any, context: RepositoryErrorContext): PostgresError {
    if (!error) {
      return this.unknownError(context);
    }

    // Normalizar contexto
    const normalizedContext = this.normalizeContext(context, error);
    
    // Obtener propiedades del error
    const code = error.code || '';
    const constraint = error.constraint;
    const detail = error.detail || error.message;
    const column = error.column;
    
    // Determinar categoría
    const category = this.ERROR_MAP[code] || RepositoryErrorSubCategory.QUERY_SYNTAX;
    
    // Construir mensaje descriptivo
    const message = this.buildErrorMessage(error, code, constraint, detail, column);
    
    // Construir objeto de detalles
    const detailsObj = {
      detail,
      constraint,
      column,
      table: normalizedContext.table,
      message: error.message,
      hint: error.hint,
      where: error.where,
      schema: error.schema,
      dataType: error.dataType,
      internalQuery: error.internalQuery,
      internalPosition: error.internalPosition,
      position: error.position,
      routine: error.routine,
      file: error.file,
      line: error.line,
    };

    return new PostgresError(
      message,
      category,
      {
        ...normalizedContext,
        code,
        constraints: constraint ? [...(normalizedContext.constraints || []), constraint] : normalizedContext.constraints,
        details: JSON.stringify(detailsObj),
      },
      error
    );
  }

  private static normalizeContext(context: RepositoryErrorContext, error: any): RepositoryErrorContext {
    const normalized = { ...context };
    
    // Inferir tabla si no está presente
    if (!normalized.table) {
      if (error.table) {
        normalized.table = error.table;
      } else if (normalized.repositoryName) {
        normalized.table = normalized.repositoryName
          .toLowerCase()
          .replace('repository', '')
          .replace(/s$/, '') + 's';
      }
    }
    
    return normalized;
  }

  private static buildErrorMessage(
    error: any,
    code: string,
    constraint?: string,
    detail?: string,
    column?: string
  ): string {
    // Mensajes específicos por código
    const messageMap: Record<string, string> = {
      '23505': `Violación de unicidad: ${constraint || detail || 'valor duplicado'}`,
      '23503': `Violación de llave foránea: ${constraint || detail}`,
      '23502': `Violación NOT NULL en columna: ${column || 'columna desconocida'}`,
      '23514': `Violación de restricción CHECK: ${constraint || detail}`,
      '40P01': 'Deadlock detectado en transacción',
      '42501': 'Permiso denegado para la operación',
      '42P01': `Tabla no encontrada: ${error.table || 'tabla desconocida'}`,
      '42601': 'Error de sintaxis en consulta SQL',
      '57014': 'Timeout de consulta',
      '08006': 'Error de conexión a la base de datos',
    };

    return messageMap[code] || error.message || 'Error de PostgreSQL desconocido';
  }

  // Factory methods específicos
  static notFound(context: RepositoryErrorContext, entityId?: string): PostgresError {
    const message = entityId 
      ? `Registro con ID '${entityId}' no encontrado en ${context.table}`
      : `Registro no encontrado en ${context.table}`;

    return new PostgresError(
      message,
      RepositoryErrorSubCategory.NOT_FOUND,
      {
        ...context,
        code: 'P0002',
        details: JSON.stringify({ entityId, table: context.table }),
      }
    );
  }

  static duplicateKey(
    context: RepositoryErrorContext,
    constraint: string,
    duplicateValue?: any,
    originalError?: any
  ): PostgresError {
    return new PostgresError(
      `Violación de unicidad en restricción '${constraint}'`,
      RepositoryErrorSubCategory.DUPLICATE_KEY,
      {
        ...context,
        constraints: [...(context.constraints || []), constraint],
        code: '23505',
        details: JSON.stringify({ constraint, duplicateValue }),
      },
      originalError
    );
  }

  static foreignKeyViolation(
    context: RepositoryErrorContext,
    constraint: string,
    referencedTable?: string,
    originalError?: any
  ): PostgresError {
    const message = referencedTable
      ? `Violación de llave foránea '${constraint}' referenciando tabla '${referencedTable}'`
      : `Violación de llave foránea: ${constraint}`;

    return new PostgresError(
      message,
      RepositoryErrorSubCategory.CONSTRAINT,
      {
        ...context,
        constraints: [...(context.constraints || []), constraint],
        code: '23503',
        details: JSON.stringify({ constraint, referencedTable }),
      },
      originalError
    );
  }

  static notNullViolation(
    context: RepositoryErrorContext,
    column: string,
    originalError?: any
  ): PostgresError {
    return new PostgresError(
      `La columna '${column}' no puede ser nula`,
      RepositoryErrorSubCategory.VALIDATION,
      {
        ...context,
        column,
        code: '23502',
        details: JSON.stringify({ column, table: context.table }),
      },
      originalError
    );
  }

  static connection(context: RepositoryErrorContext, originalError?: any): PostgresError {
    return new PostgresError(
      'Error de conexión a PostgreSQL',
      RepositoryErrorSubCategory.CONNECTION,
      {
        ...context,
        code: '08006',
        details: JSON.stringify({ type: 'connection_error' }),
      },
      originalError
    );
  }

  static timeout(context: RepositoryErrorContext, timeoutMs?: number, originalError?: any): PostgresError {
    return new PostgresError(
      timeoutMs ? `Timeout después de ${timeoutMs}ms` : 'Timeout de consulta',
      RepositoryErrorSubCategory.TIMEOUT,
      {
        ...context,
        code: '57014',
        details: JSON.stringify({ timeoutMs, operation: context.operation }),
      },
      originalError
    );
  }

  static deadlock(context: RepositoryErrorContext, processes?: string[], originalError?: any): PostgresError {
    return new PostgresError(
      'Deadlock detectado en transacción',
      RepositoryErrorSubCategory.LOCK,
      { 
        ...context, 
        code: '40P01',
        details: JSON.stringify({ type: 'deadlock', processes }),
      },
      originalError
    );
  }

  static permission(context: RepositoryErrorContext, operation?: string, originalError?: any): PostgresError {
    return new PostgresError(
      operation ? `Permiso denegado para ${operation}` : 'Permiso denegado',
      RepositoryErrorSubCategory.PERMISSION,
      { 
        ...context, 
        code: '42501',
        details: JSON.stringify({ operation, table: context.table }),
      },
      originalError
    );
  }

  static querySyntax(context: RepositoryErrorContext, details: string, originalError?: any): PostgresError {
    return new PostgresError(
      `Error de sintaxis en consulta: ${details}`,
      RepositoryErrorSubCategory.QUERY_SYNTAX,
      {
        ...context,
        code: '42601',
        details: JSON.stringify({ syntaxError: details }),
      },
      originalError
    );
  }

  static transaction(context: RepositoryErrorContext, reason: string, originalError?: any): PostgresError {
    return new PostgresError(
      `Error de transacción: ${reason}`,
      RepositoryErrorSubCategory.TRANSACTION,
      {
        ...context,
        details: JSON.stringify({ transactionError: reason }),
      },
      originalError
    );
  }

  static configuration(context: RepositoryErrorContext, configIssue: string, originalError?: any): PostgresError {
    return new PostgresError(
      `Error de configuración: ${configIssue}`,
      RepositoryErrorSubCategory.CONFIGURATION,
      {
        ...context,
        details: JSON.stringify({ configIssue }),
      },
      originalError
    );
  }

  static unknownError(context: RepositoryErrorContext): PostgresError {
    return new PostgresError(
      'Error desconocido de PostgreSQL',
      RepositoryErrorSubCategory.CONNECTION,
      context
    );
  }

  // Método para validar si es error de PostgreSQL
  static isPostgresError(error: any): boolean {
    return error && (
      error.code !== undefined ||
      error.severity !== undefined ||
      error.hint !== undefined ||
      error.routine !== undefined ||
      (error.message && error.message.includes('PostgreSQL')) ||
      (error.message && error.message.includes('postgres'))
    );
  }
}