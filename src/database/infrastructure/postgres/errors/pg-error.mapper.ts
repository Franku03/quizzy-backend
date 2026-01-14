/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\errors\pg-error.mapper.ts

import { ErrorData, ErrorLayer } from 'src/core/types';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';

/**
 * Interfaz para representar la estructura de errores de la librería 'pg' (node-postgres)
 */
interface PostgresNativeError extends Error {
  code: string; // SQLSTATE code
  detail?: string; // Información detallada
  table?: string;
  constraint?: string;
  column?: string;
  dataType?: string;
}

export class PostgresErrorMapper implements IErrorMapper<
  unknown,
  IDatabaseErrorContext
> {
  public toErrorData(
    error: unknown,
    context: IDatabaseErrorContext,
  ): ErrorData {
    const baseDetails = context;
    const pgError = error as PostgresNativeError;

    // 1. VIOLACIÓN DE UNICIDAD (Unique Violation) - SQLSTATE 23505
    if (pgError.code === '23505') {
      return new ErrorData(
        'DUPLICATE_RESOURCE_CONSTRAINT',
        pgError.detail ?? 'Violation of unique index constraint.',
        ErrorLayer.INFRASTRUCTURE,
        {
          ...baseDetails,
          postgresCode: '23505',
          constraint: pgError.constraint,
          detail: pgError.detail,
        },
        pgError,
      );
    }

    // 2. VIOLACIÓN DE LLAVE FORÁNEA (Foreign Key Violation) - SQLSTATE 23503
    if (pgError.code === '23503') {
      return new ErrorData(
        'FOREIGN_KEY_CONSTRAINT',
        'Referenced resource does not exist or is still in use.',
        ErrorLayer.INFRASTRUCTURE,
        {
          ...baseDetails,
          postgresCode: '23503',
          constraint: pgError.constraint,
          detail: pgError.detail,
        },
        pgError,
      );
    }

    // 3. VIOLACIÓN DE NOT NULL (Not Null Violation) - SQLSTATE 23502
    if (pgError.code === '23502') {
      return new ErrorData(
        'DB_SCHEMA_VALIDATION',
        `Field ${pgError.column ?? 'unknown'} cannot be null.`,
        ErrorLayer.INFRASTRUCTURE,
        {
          ...baseDetails,
          postgresCode: '23502',
          column: pgError.column,
        },
        pgError,
      );
    }

    // 4. ERROR DESCONOCIDO
    const message = pgError.message || 'Unknown PostgreSQL infrastructure error.';
    const safeError = error instanceof Error ? error : undefined;

    return new ErrorData(
      'INFRA_UNKNOWN_ERROR',
      message,
      ErrorLayer.INFRASTRUCTURE,
      { ...baseDetails, postgresCode: pgError.code },
      safeError,
    );
  }
}