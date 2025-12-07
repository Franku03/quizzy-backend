// src/database/infrastructure/errors/database-error.ts
import { InfrastructureError } from 'src/core/errors/infraestructure/infraestructure-error';

export type DatabaseDriver = 'mongodb' | 'postgresql';

export abstract class DatabaseError extends InfrastructureError {
  constructor(
    type: string,
    message: string,
    public readonly driver: DatabaseDriver,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      type, 
      message, 
      { 
        driver,
        ...metadata 
      }, 
      originalError
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}