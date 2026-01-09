/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\logging\logger.interface.ts

// core/application/aspects/logging/logger.interface.ts

// This interface defines the contract for logging within the application layer.
// It allows the application to log messages without being coupled to any specific
// logging implementation, adhering to the Dependency Inversion Principle.
// The actual implementation will be provided by the infrastructure layer.
export interface ILogger {
  // Logs an informational message. Used for normal operation events that are
  // not errors but provide insight into what the application is doing.
  // the metadata parameter can include additional context like userId, attemptId, etc.
  log(message: string, metadata?: Record<string, any>): void;

  // Logs an error message. Used when something goes wrong during execution.
  // The error object contains details about what failed and why.
  error(message: string, error?: any, metadata?: Record<string, any>): void;

  // EL FUTURO: Para errores de negocio/aplicación controlados (sin Stack Trace sucio)
  errorResult(message: string, metadata?: Record<string, any>): void;
}