// src/database/infrastructure/errors/repository-error.ts
import { DatabaseError, DatabaseDriver } from './database-error';
import { RepositoryErrorSubCategory } from './repository-error-sub-category.enum';
import { RepositoryErrorContext } from './repository-error-context.interface';

export class RepositoryError extends DatabaseError {
  constructor(
    message: string,
    public readonly subCategory: RepositoryErrorSubCategory,
    public readonly context: RepositoryErrorContext,
    driver: DatabaseDriver,
    originalError?: any
  ) {
    super(
      'RepositoryError',
      message, 
      driver, 
      { 
        subCategory, 
        context 
      },
      originalError
    );
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}