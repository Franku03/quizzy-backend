// core/application/logging/logger.token.ts

// This token is used for dependency injection of the ILogger interface.
// It allows different implementations of ILogger to be swapped in
// without changing the application code that depends on it.
export const LOGGER_TOKEN = 'ILogger';