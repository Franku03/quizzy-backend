import {
  isCloudinaryDuplicateError,
  isCloudinaryInvalidFileError,
  isCloudinaryConfigError,
  isCloudinaryRateLimitError,
  isCloudinaryNetworkError,
  isCloudinaryUploadError,
  isCloudinaryDeleteError
} from './cloudinary.error.guards';
// ========== GUARDS COMPUESTOS ==========
// Errores causados por el cliente (datos inválidos)
export const isCloudinaryClientError = (error: any): boolean =>
  isCloudinaryDuplicateError(error) ||
  isCloudinaryInvalidFileError(error);

// Errores del servidor Cloudinary
export const isCloudinaryServerError = (error: any): boolean =>
  isCloudinaryConfigError(error) ||
  isCloudinaryRateLimitError(error) ||
  isCloudinaryNetworkError(error);

// Errores recuperables (se pueden reintentar)
export const isCloudinaryRecoverableError = (error: any): boolean =>
  isCloudinaryRateLimitError(error) ||  // Esperar y reintentar
  isCloudinaryNetworkError(error);      // Reintentar conexión

// Errores de operaciones de subida
export const isCloudinaryUploadOperationError = (error: any): boolean =>
  isCloudinaryUploadError(error) ||
  isCloudinaryDuplicateError(error) ||
  isCloudinaryInvalidFileError(error);

// Errores de operaciones de eliminación
export const isCloudinaryDeleteOperationError = (error: any): boolean =>
  isCloudinaryDeleteError(error);