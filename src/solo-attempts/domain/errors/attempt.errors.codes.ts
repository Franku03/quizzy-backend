// These errors codes are used to identify specific error conditions related to solo attempts
// throughout the domain and application. They help in consistent error handling and messaging.
// without coupling to infrastructure-specific error types (like http).
// once these errors get to the infrastructure layer, they can be mapped to appropriate HTTP errors.

export const ATTEMPT_ERROR_CODES = {
  KAHOOT_NOT_FOUND: 'KAHOOT_NOT_FOUND',
  DRAFT_KAHOOT: 'DRAFT_KAHOOT',
  NO_SLIDES: 'NO_SLIDES',
  ATTEMPT_NOT_FOUND: 'ATTEMPT_NOT_FOUND',
  UNAUTHORIZED_ATTEMPT_ACCESS: 'UNAUTHORIZED_ATTEMPT_ACCESS',
  ATTEMPT_NOT_IN_PROGRESS: 'ATTEMPT_NOT_IN_PROGRESS',
  SLIDE_ALREADY_ANSWERED: 'SLIDE_ALREADY_ANSWERED',
  INVALID_SUBMISSION: 'INVALID_SUBMISSION',
  COMPLETED_ATTEMPT_NOT_FOUND: 'COMPLETED_ATTEMPT_NOT_FOUND',
} as const;