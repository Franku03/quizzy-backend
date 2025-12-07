// src/database/infrastructure/errors/repository-error-sub-category.enum.ts
export enum RepositoryErrorSubCategory {
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  VALIDATION = 'VALIDATION',
  CONNECTION = 'CONNECTION',
  TIMEOUT = 'TIMEOUT',
  CONSTRAINT = 'CONSTRAINT',
  LOCK = 'LOCK',
  QUERY_SYNTAX = 'QUERY_SYNTAX',
  PERMISSION = 'PERMISSION',
  TRANSACTION = 'TRANSACTION',
  CONFIGURATION = 'CONFIGURATION',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
}

export class RepositoryErrorSubCategoryHelpers {
  static isNotFound(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.NOT_FOUND;
  }
  
  static isDuplicateKey(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.DUPLICATE_KEY;
  }
  
  static isConnectionError(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.CONNECTION;
  }
  
  static isTimeout(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.TIMEOUT;
  }
  
  static isConstraint(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.CONSTRAINT;
  }
  
  static isValidation(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.VALIDATION;
  }
  
  static isPermission(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.PERMISSION;
  }
  
  static isLock(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.LOCK;
  }
  
  static isTransaction(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.TRANSACTION;
  }
  
  static isConfiguration(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.CONFIGURATION;
  }
  
  static isResourceExhausted(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.RESOURCE_EXHAUSTED;
  }
  
  static isQuerySyntax(category: RepositoryErrorSubCategory): boolean {
    return category === RepositoryErrorSubCategory.QUERY_SYNTAX;
  }
  
  static isClientError(category: RepositoryErrorSubCategory): boolean {
    return [
      RepositoryErrorSubCategory.NOT_FOUND,
      RepositoryErrorSubCategory.DUPLICATE_KEY,
      RepositoryErrorSubCategory.VALIDATION,
      RepositoryErrorSubCategory.CONSTRAINT,
      RepositoryErrorSubCategory.QUERY_SYNTAX,
      RepositoryErrorSubCategory.PERMISSION,
    ].includes(category);
  }
  
  static isRecoverable(category: RepositoryErrorSubCategory): boolean {
    // Errores que pueden recuperarse con reintento
    return [
      RepositoryErrorSubCategory.CONNECTION,
      RepositoryErrorSubCategory.TIMEOUT,
      RepositoryErrorSubCategory.LOCK,
      RepositoryErrorSubCategory.RESOURCE_EXHAUSTED,
    ].includes(category);
  }
}