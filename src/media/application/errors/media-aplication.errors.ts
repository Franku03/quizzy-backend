// src/media/application/errors/media-application.errors.ts
import { ApplicationError } from 'src/core/errors/application/application-error';

/**
 * Error al subir asset
 */
export class UploadAssetError extends ApplicationError {
  constructor(
    message: string,
    public readonly userId?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super('UploadAssetError', message, { userId, ...metadata }, originalError);
  }
}

/**
 * Error al obtener URL de asset (individual)
 */
export class GetAssetUrlError extends ApplicationError {
  constructor(
    message: string,
    public readonly publicId?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super('GetAssetUrlError', message, { publicId, ...metadata }, originalError);
  }
}

/**
 * Error al obtener URLs en batch
 */
export class GetAssetUrlsBatchError extends ApplicationError {
  constructor(
    message: string,
    public readonly failedIds?: string[],
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super('GetAssetUrlsBatchError', message, { failedIds, ...metadata }, originalError);
  }
}

/**
 * Error cuando asset no existe
 */
export class AssetNotFoundError extends GetAssetUrlError {
  constructor(
    public readonly publicId?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      `Asset no encontrado: ${publicId}`,
      publicId,
      { ...metadata, code: 'ASSET_NOT_FOUND' },
      originalError
    );
  }
}

/**
 * Error de referencia inválida de asset
 */
export class InvalidAssetReferenceError extends GetAssetUrlError {
  constructor(
    public readonly publicId?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      `Asset ${publicId} tiene referencia inválida`,
      publicId,
      { ...metadata, code: 'INVALID_REFERENCE' },
      originalError
    );
  }
}

/**
 * Error de ID de asset inválido
 */
export class InvalidAssetIdError extends GetAssetUrlError {
  constructor(
    public readonly publicId?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      `ID de asset inválido: ${publicId}`,
      publicId,
      { ...metadata, code: 'INVALID_ID' },
      originalError
    );
  }
}

/**
 * Error del storage provider
 */
export class StorageProviderError extends ApplicationError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly operation: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'StorageProviderError',
      message,
      { provider, operation, ...metadata },
      originalError
    );
  }
}

/**
 * Error de base de datos para media
 */
export class MediaDatabaseError extends ApplicationError {
  constructor(
    message: string,
    public readonly driver?: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'MediaDatabaseError',
      message,
      { driver, ...metadata },
      originalError
    );
  }
}

/**
 * Error inesperado en media
 */
export class UnexpectedMediaError extends ApplicationError {
  constructor(
    message: string,
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    super(
      'UnexpectedMediaError',
      `Error inesperado: ${message}`,
      metadata,
      originalError
    );
  }
}

// Union type simplificado
export type MediaApplicationError = 
  | UploadAssetError
  | GetAssetUrlError
  | GetAssetUrlsBatchError
  | AssetNotFoundError
  | InvalidAssetReferenceError
  | InvalidAssetIdError
  | StorageProviderError
  | MediaDatabaseError
  | UnexpectedMediaError;