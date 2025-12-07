// src/media/infrastructure/cloudinary/cloudinary-error.factory.ts
import { CloudinaryError } from './cloudinary.error';

export type CloudinaryContext = {
  publicId?: string,
  storageKey?: string;
  folder?: string;
  fileSize?: number;
  mimeType?: string;
  transformations?: Record<string, any>;
  expiresIn?: number;
  signed?: boolean;
};

export class CloudinaryErrorFactory {
  static uploadError(
    error: any,
    context?: CloudinaryContext
  ): CloudinaryError {
    const message = this.buildUploadMessage(error, context);
    
    return new CloudinaryError(
      message,
      'upload',
      {
        ...context,
        code: error.code || error.http_code,
        cloudinaryErrorCode: error.error?.code,
        httpCode: error.http_code,
      },
      error
    );
  }

  static deleteError(
    error: any,
    context?: CloudinaryContext
  ): CloudinaryError {
    const message = this.buildDeleteMessage(error, context);
    
    return new CloudinaryError(
      message,
      'delete',
      {
        ...context,
        code: error.code || error.http_code,
        httpCode: error.http_code,
      },
      error
    );
  }

  static generateUrlError(
    error: any,
    context?: CloudinaryContext
  ): CloudinaryError {
    return new CloudinaryError(
      'Error generando URL de Cloudinary',
      'generate-url',
      {
        ...context,
        code: error.code,
        originalMessage: error.message,
      },
      error
    );
  }

  private static buildUploadMessage(error: any, context?: CloudinaryContext): string {
    if (error.http_code === 400) {
      if (error.message.includes('already exists')) {
        return `El archivo ya existe en Cloudinary: ${context?.publicId || context?.storageKey}`;
      }
      if (error.message.includes('Invalid image file')) {
        return 'Formato de imagen no válido para Cloudinary';
      }
      if (error.message.includes('File size too large')) {
        return 'El archivo excede el tamaño máximo permitido por Cloudinary';
      }
      return 'Solicitud inválida a Cloudinary (verifica formato y tamaño)';
    }
    
    if (error.http_code === 401 || error.http_code === 403) {
      return 'Credenciales de Cloudinary inválidas o expiradas';
    }
    
    if (error.http_code === 413) {
      return 'Archivo demasiado grande para Cloudinary';
    }
    
    if (error.http_code === 429) {
      return 'Límite de tasa excedido en Cloudinary (demasiadas solicitudes)';
    }
    
    if (error.http_code >= 500) {
      return 'Error interno del servidor de Cloudinary';
    }
    
    return error.message || 'Error desconocido al subir a Cloudinary';
  }

  private static buildDeleteMessage(error: any, context?: CloudinaryContext): string {
    if (error.http_code === 404) {
      return `Recurso no encontrado en Cloudinary: ${context?.publicId || context?.storageKey}`;
    }
    
    return error.message || 'Error eliminando recurso de Cloudinary';
  }
}