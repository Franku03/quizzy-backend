// src/database/infrastructure/errors/postgres/postgres-error.ts
import { RepositoryError } from '../repository-error';
import { RepositoryErrorSubCategory, RepositoryErrorSubCategoryHelpers } from '../repository-error-sub-category.enum';
import { RepositoryErrorContext } from '../repository-error-context.interface';

export class PostgresError extends RepositoryError {
  private _parsedDetails: Record<string, any>;

  constructor(
    message: string,
    subCategory: RepositoryErrorSubCategory,
    context: RepositoryErrorContext,
    originalError?: any
  ) {
    super(message, subCategory, context, 'postgresql', originalError);
    this._parsedDetails = this.parseDetails(context.details);
    Object.setPrototypeOf(this, PostgresError.prototype);
  }

  private parseDetails(details?: string): Record<string, any> {
    if (!details) return {};
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  }

  // Getters de categoría
  get isNotFound(): boolean {
    return RepositoryErrorSubCategoryHelpers.isNotFound(this.subCategory);
  }
  
  get isDuplicateKey(): boolean {
    return RepositoryErrorSubCategoryHelpers.isDuplicateKey(this.subCategory);
  }
  
  get isConnectionError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isConnectionError(this.subCategory);
  }
  
  get isTimeout(): boolean {
    return RepositoryErrorSubCategoryHelpers.isTimeout(this.subCategory);
  }
  
  get isConstraintViolation(): boolean {
    return RepositoryErrorSubCategoryHelpers.isConstraint(this.subCategory);
  }
  
  get isValidationError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isValidation(this.subCategory);
  }
  
  get isPermissionError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isPermission(this.subCategory);
  }
  
  get isLockError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isLock(this.subCategory);
  }
  
  get isTransactionError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isTransaction(this.subCategory);
  }
  
  get isConfigurationError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isConfiguration(this.subCategory);
  }
  
  get isResourceExhausted(): boolean {
    return RepositoryErrorSubCategoryHelpers.isResourceExhausted(this.subCategory);
  }
  
  get isQuerySyntaxError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isQuerySyntax(this.subCategory);
  }
  
  get isRecoverable(): boolean {
    return RepositoryErrorSubCategoryHelpers.isRecoverable(this.subCategory);
  }
  
  get isClientError(): boolean {
    return RepositoryErrorSubCategoryHelpers.isClientError(this.subCategory);
  }

  // PostgreSQL específico
  get postgresCode(): string | undefined {
    return this.context.code;
  }

  get constraints(): string[] | undefined {
    return this.context.constraints;
  }

  get table(): string | undefined {
    return this.context.table;
  }

  get column(): string | undefined {
    return this._parsedDetails.column || this.context.column;
  }

  get operation(): string {
    return this.context.operation;
  }

  // Métodos de violaciones específicas de PostgreSQL
  get isForeignKeyViolation(): boolean {
    if (this.context.code === '23503') return true;
    if (this.constraints?.some(c => c.includes('foreign') || c.includes('fk_'))) return true;
    return this._parsedDetails.constraint?.includes('foreign') || false;
  }

  get isUniqueViolation(): boolean {
    if (this.context.code === '23505') return true;
    if (this.constraints?.some(c => c.includes('unique') || c.includes('pk_') || c.includes('uq_'))) return true;
    return this._parsedDetails.constraint?.includes('unique') || false;
  }

  get isCheckViolation(): boolean {
    if (this.context.code === '23514') return true;
    if (this.constraints?.some(c => c.includes('check') || c.includes('ck_'))) return true;
    return this._parsedDetails.constraint?.includes('check') || false;
  }

  get isNotNullViolation(): boolean {
    if (this.context.code === '23502') return true;
    return this._parsedDetails.column !== undefined && this._parsedDetails.detail?.includes('null');
  }

  // Métodos para acceder a detalles específicos
  get hint(): string | undefined {
    return this._parsedDetails.hint;
  }

  get schema(): string | undefined {
    return this._parsedDetails.schema;
  }

  get internalQuery(): string | undefined {
    return this._parsedDetails.internalQuery;
  }

  get position(): number | undefined {
    return this._parsedDetails.position || this._parsedDetails.internalPosition;
  }

  get dataType(): string | undefined {
    return this._parsedDetails.dataType;
  }

  // Métodos de utilidad
  suggestSolution(): string {
    if (this.isForeignKeyViolation) {
      return 'Verificar que los datos referenciados existan en la tabla relacionada';
    }
    if (this.isUniqueViolation) {
      return 'El valor ya existe en la base de datos, debe ser único';
    }
    if (this.isNotNullViolation) {
      return `La columna '${this.column}' no puede ser nula`;
    }
    if (this.isConnectionError) {
      return 'Verificar conexión a la base de datos y credenciales';
    }
    if (this.isTimeout) {
      return 'Considerar optimizar la consulta o aumentar timeout';
    }
    return 'Consulte la documentación de PostgreSQL para más detalles';
  }
}