// src/media/application/errors/media-error.factory.ts
import { 
  UploadAssetError, 
  GetAssetUrlError,
  GetAssetUrlsBatchError,
  AssetNotFoundError,
  InvalidAssetReferenceError,
  InvalidAssetIdError,
  StorageProviderError,
  MediaDatabaseError,
  UnexpectedMediaError
} from './media-aplication.errors';

export class MediaErrorFactory {
  
  // ================= UPLOAD ERRORS =================
  
  static emptyFile(): UploadAssetError {
    return new UploadAssetError('El archivo está vacío');
  }
  
  static duplicateAsset(existingPublicId: string): UploadAssetError {
    return new UploadAssetError(`Asset duplicado: ${existingPublicId}`);
  }
  
  static uploadFailed(message: string, originalError?: any): UploadAssetError {
    return new UploadAssetError(
      `Upload falló: ${message}`,
      undefined,
      { timestamp: new Date() },
      originalError
    );
  }
  
  static storageUploadFailed(provider: string, error: string): StorageProviderError {
    return new StorageProviderError(
      `Storage ${provider} falló: ${error}`,
      provider,
      'upload'
    );
  }
  
  // ================= GET URL (INDIVIDUAL) ERRORS =================
  
  static invalidAssetId(publicId: string): InvalidAssetIdError {
    return new InvalidAssetIdError(publicId);
  }
  
  static assetNotFound(publicId: string): AssetNotFoundError {
    return new AssetNotFoundError(publicId);
  }
  
  static invalidAssetReference(publicId: string): InvalidAssetReferenceError {
    return new InvalidAssetReferenceError(publicId);
  }
  
  static urlGenerationFailed(publicId: string, provider: string): GetAssetUrlError {
    return new GetAssetUrlError(
      `No se pudo generar URL para ${publicId}`,
      publicId,
      { provider }
    );
  }
  
  // ================= BATCH ERRORS =================
  
  static batchFailed(ids: string[], error: string): GetAssetUrlsBatchError {
    return new GetAssetUrlsBatchError(
      `Batch falló para ${ids.length} assets: ${error}`,
      ids,
      { count: ids.length }
    );
  }
  
  static emptyBatch(): GetAssetUrlsBatchError {
    return new GetAssetUrlsBatchError('Lista de IDs vacía');
  }
  
  // ================= DATABASE ERRORS =================
  
  static databaseError(message: string, originalMessage?: string, driver?: string): MediaDatabaseError {
    return new MediaDatabaseError(
      `Database error: ${message}`,
      driver || 'mongodb',
      { 
        originalMessage,
        code: 'DATABASE_ERROR'
      }
    );
  }
  
  // ================= STORAGE PROVIDER ERRORS =================
  
  static storageProviderError(
    originalError: any,
    provider: string,
    operation: string,
    context?: Record<string, any>
  ): StorageProviderError {
    const message = originalError?.message || 'Error desconocido del storage provider';
    
    return new StorageProviderError(
      message,
      provider,
      operation,
      {
        ...context,
        originalError: originalError?.toJSON ? originalError.toJSON() : originalError,
        timestamp: new Date()
      },
      originalError
    );
  }
  
  // ================= UNEXPECTED ERRORS =================
  
  static unexpectedError(message: string, originalError?: any): UnexpectedMediaError {
    return new UnexpectedMediaError(
      message,
      { 
        timestamp: new Date(),
        code: 'UNEXPECTED_ERROR'
      },
      originalError
    );
  }
}