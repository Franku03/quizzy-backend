export const CloudinaryErrorType = {
  UPLOAD: 'CloudinaryUploadError' as const,
  DUPLICATE: 'CloudinaryDuplicateError' as const,
  DELETE: 'CloudinaryDeleteError' as const,
  CONFIG: 'CloudinaryConfigError' as const,
  RATE_LIMIT: 'CloudinaryRateLimitError' as const,
  NETWORK: 'CloudinaryNetworkError' as const,
  INVALID_FILE: 'CloudinaryInvalidFileError' as const,
} as const;