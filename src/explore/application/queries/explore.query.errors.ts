// These error codes are used throughout the Explore application layer
// to standardize error handling and reporting.
// without coupling to nestjs specific error handling mechanisms.
export const EXPLORE_ERROR_CODES = {
  INVALID_PAGINATION_PARAMS: 'INVALID_PAGINATION_PARAMS',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;