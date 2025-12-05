import { InfrastructureErrorOf } from 'src/core/infrastructure/errors/base.error';

export type CloudinaryOperation = 'upload' | 'delete' | 'config';


// Error al subir archivo
export type CloudinaryUploadError = InfrastructureErrorOf<'CloudinaryUploadError'> & {
  hash?: string;
  fileSize?: number;
  mimeType?: string;
  operation: 'upload';
};

// Error de duplicidad (archivo ya existe)
export type CloudinaryDuplicateError = InfrastructureErrorOf<'CloudinaryDuplicateError'> & {
  hash: string;
  operation: 'upload';
};

// Error al eliminar archivo
export type CloudinaryDeleteError = InfrastructureErrorOf<'CloudinaryDeleteError'> & {
  publicId: string;
  operation: 'delete';
};

// Error de configuración/autenticación
export type CloudinaryConfigError = InfrastructureErrorOf<'CloudinaryConfigError'> & {
  operation: 'config';
};

// Error de límite de tasa (rate limiting)
export type CloudinaryRateLimitError = InfrastructureErrorOf<'CloudinaryRateLimitError'> & {
  retryAfter?: number;
  operation: 'upload' | 'delete';
};

// Error de red/conexión
export type CloudinaryNetworkError = InfrastructureErrorOf<'CloudinaryNetworkError'> & {
  operation: 'upload' | 'delete';
};

// Error de archivo inválido
export type CloudinaryInvalidFileError = InfrastructureErrorOf<'CloudinaryInvalidFileError'> & {
  fileSize?: number;
  mimeType?: string;
  operation: 'upload';
};

export type CloudinaryError = 
  | CloudinaryUploadError
  | CloudinaryDuplicateError
  | CloudinaryDeleteError
  | CloudinaryConfigError
  | CloudinaryRateLimitError
  | CloudinaryNetworkError
  | CloudinaryInvalidFileError;