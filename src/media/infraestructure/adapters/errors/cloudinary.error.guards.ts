import { createTypeGuard, createTypeGuardForPrefix } from 'src/core/infrastructure/errors/type-guards';
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


// Guard general para cualquier error de Cloudinary
export const isCloudinaryError = createTypeGuardForPrefix('Cloudinary');

// Guards específicos para cada tipo de error
export const isCloudinaryUploadError = createTypeGuard<CloudinaryUploadError>(
  CloudinaryErrorType.UPLOAD
);

export const isCloudinaryDuplicateError = createTypeGuard<CloudinaryDuplicateError>(
  CloudinaryErrorType.DUPLICATE
);

export const isCloudinaryDeleteError = createTypeGuard<CloudinaryDeleteError>(
  CloudinaryErrorType.DELETE
);

export const isCloudinaryConfigError = createTypeGuard<CloudinaryConfigError>(
  CloudinaryErrorType.CONFIG
);

export const isCloudinaryRateLimitError = createTypeGuard<CloudinaryRateLimitError>(
  CloudinaryErrorType.RATE_LIMIT
);

export const isCloudinaryNetworkError = createTypeGuard<CloudinaryNetworkError>(
  CloudinaryErrorType.NETWORK
);

export const isCloudinaryInvalidFileError = createTypeGuard<CloudinaryInvalidFileError>(
  CloudinaryErrorType.INVALID_FILE
);