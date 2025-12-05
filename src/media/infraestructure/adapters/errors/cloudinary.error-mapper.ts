import {
  CloudinaryError,
  CloudinaryUploadError,
  CloudinaryDuplicateError,
  CloudinaryDeleteError,
  CloudinaryConfigError,
  CloudinaryRateLimitError,
  CloudinaryNetworkError,
  CloudinaryInvalidFileError
} from './cloudinary.types';
import { CloudinaryErrorType } from './cloudinary.errors.constans';

export interface ErrorMappingOptions {
  hash?: string;
  publicId?: string;
  fileSize?: number;
  mimeType?: string;
  operation?: 'upload' | 'delete';
}

export class CloudinaryErrorMapper {
  static mapUploadError(
    error: any,
    options: ErrorMappingOptions = {}
  ): CloudinaryError {
    const { hash, fileSize, mimeType } = options;
    const timestamp = new Date();

    // Error de duplicidad (archivo ya existe)
    if (error.http_code === 400 && error.message?.includes('already exists')) {
      const cloudinaryError: CloudinaryDuplicateError = {
        type: CloudinaryErrorType.DUPLICATE,
        message: `El archivo con hash ${hash} ya existe en Cloudinary`,
        timestamp,
        originalError: error,
        hash: hash!,
        operation: 'upload',
      };
      return cloudinaryError;
    }

    // Error de límite de tasa (rate limiting)
    if (error.http_code === 429) {
      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after'])
        : undefined;

      const cloudinaryError: CloudinaryRateLimitError = {
        type: CloudinaryErrorType.RATE_LIMIT,
        message: 'Límite de tasa de Cloudinary excedido',
        timestamp,
        originalError: error,
        retryAfter,
        operation: 'upload',
      };
      return cloudinaryError;
    }

    // Error de autenticación/configuración
    if (error.http_code === 401 || error.http_code === 403) {
      const cloudinaryError: CloudinaryConfigError = {
        type: CloudinaryErrorType.CONFIG,
        message: 'Error de autenticación con Cloudinary',
        timestamp,
        originalError: error,
        operation: 'config',
      };
      return cloudinaryError;
    }

    // Error de archivo inválido (tamaño)
    if (error.http_code === 400 && error.message?.includes('File size too large')) {
      const cloudinaryError: CloudinaryInvalidFileError = {
        type: CloudinaryErrorType.INVALID_FILE,
        message: 'El tamaño del archivo excede los límites de Cloudinary',
        timestamp,
        originalError: error,
        fileSize,
        mimeType,
        operation: 'upload',
      };
      return cloudinaryError;
    }

    // Error de archivo inválido (formato)
    if (error.http_code === 400 && error.message?.includes('Invalid image file')) {
      const cloudinaryError: CloudinaryInvalidFileError = {
        type: CloudinaryErrorType.INVALID_FILE,
        message: 'Formato de archivo inválido',
        timestamp,
        originalError: error,
        fileSize,
        mimeType,
        operation: 'upload',
      };
      return cloudinaryError;
    }

    // Error de red/conexión
    if (error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNREFUSED')) {
      const cloudinaryError: CloudinaryNetworkError = {
        type: CloudinaryErrorType.NETWORK,
        message: 'Error de red al conectar con Cloudinary',
        timestamp,
        originalError: error,
        operation: 'upload',
      };
      return cloudinaryError;
    }

    // Error genérico de subida
    const cloudinaryError: CloudinaryUploadError = {
      type: CloudinaryErrorType.UPLOAD,
      message: `Error al subir archivo: ${error.message || 'Error desconocido'}`,
      timestamp,
      originalError: error,
      hash,
      fileSize,
      mimeType,
      operation: 'upload',
    };

    return cloudinaryError;
  }

  static mapDeleteError(
    error: any,
    options: ErrorMappingOptions = {}
  ): CloudinaryError {
    const { publicId } = options;
    const timestamp = new Date();

    // Error de límite de tasa (rate limiting)
    if (error.http_code === 429) {
      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after'])
        : undefined;

      const cloudinaryError: CloudinaryRateLimitError = {
        type: CloudinaryErrorType.RATE_LIMIT,
        message: 'Límite de tasa de Cloudinary excedido',
        timestamp,
        originalError: error,
        retryAfter,
        operation: 'delete',
      };
      return cloudinaryError;
    }

    // Error de autenticación
    if (error.http_code === 401 || error.http_code === 403) {
      const cloudinaryError: CloudinaryConfigError = {
        type: CloudinaryErrorType.CONFIG,
        message: 'Error de autenticación con Cloudinary',
        timestamp,
        originalError: error,
        operation: 'config',
      };
      return cloudinaryError;
    }

    // Error de red
    if (error.message?.includes('network') ||
      error.message?.includes('timeout')) {
      const cloudinaryError: CloudinaryNetworkError = {
        type: CloudinaryErrorType.NETWORK,
        message: 'Error de red al conectar con Cloudinary',
        timestamp,
        originalError: error,
        operation: 'delete',
      };
      return cloudinaryError;
    }

    // Error genérico de eliminación
    const cloudinaryError: CloudinaryDeleteError = {
      type: CloudinaryErrorType.DELETE,
      message: `Error al eliminar archivo: ${error.message || 'Error desconocido'}`,
      timestamp,
      originalError: error,
      publicId: publicId!,
      operation: 'delete',
    };

    return cloudinaryError;
  }
}