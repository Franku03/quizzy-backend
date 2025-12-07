// src/modules/media/infrastructure/cloudinary/cloudinary.error.ts
import { StorageError } from "src/media/infraestructure/errors/storage.error";

export class CloudinaryError extends StorageError {
  // Constructor directo, sin complicaciones
  constructor(
    message: string,
    operation: 'upload' | 'delete' | 'generate-url',
    metadata?: Record<string, any>,
    originalError?: any
  ) {
    const enrichedMetadata = {
      ...metadata,

      httpCode: originalError?.http_code,
      cloudinaryCode: originalError?.error?.code,
      requestId: originalError?.request_id,
    };
    
    super(
      'CloudinaryError',
      message,
      'cloudinary',
      operation,
      enrichedMetadata,
      originalError
    );
  }
  
  // Métodos helpers estáticos (opcionales, pero útiles)
  static fromUploadError(error: any, extraInfo?: Record<string, any>): CloudinaryError {
    return new CloudinaryError(
      CloudinaryError.buildUploadMessage(error),
      'upload',
      {
        ...extraInfo,
        fileSize: extraInfo?.fileSize,
        mimeType: extraInfo?.mimeType,
      },
      error
    );
  }
  
  static fromDeleteError(error: any, publicId?: string): CloudinaryError {
    return new CloudinaryError(
      CloudinaryError.buildDeleteMessage(error, publicId),
      'delete',
      { publicId },
      error
    );
  }
  
  private static buildUploadMessage(error: any): string {
    // Lógica simple de mensajes
    const code = error?.http_code;
    if (code === 400) return 'Invalid upload request to Cloudinary';
    if (code === 413) return 'File too large for Cloudinary';
    if (code === 429) return 'Cloudinary rate limit exceeded';
    
    return error?.message || 'Cloudinary upload failed';
  }
  
  private static buildDeleteMessage(error: any, publicId?: string): string {
    if (error?.http_code === 404) {
      return `Image not found on Cloudinary: ${publicId || 'unknown'}`;
    }
    return error?.message || 'Failed to delete from Cloudinary';
  }
}