/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\logging\log.decorator.ts

// core/application/aspects/logging/log.decorator.ts

import { isErrorData } from 'src/core/errors/type-guards.ts/error-data.type.guard';
import { Either } from 'src/core/types';

// This decorator provides cross-cutting logging concerns for command and query handlers.
// It logs the execution of methods including the function name, timestamp, use case,
// and the result or any errors that occur. This helps with debugging and monitoring
// the application's behavior in different environments.
export function Log(loggerPropertyKey = 'logger') {
  // The actual decorator function. This syntax is standard for typescript method decorators.
  // target: The prototype of the class
  // propertyKey: The name of the method being decorated
  // descriptor: The property descriptor for the method
  // Typescript decorators require us to use this signature and return a modified descriptor.
  // if unfamiliar, see: https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // We store the original method implementation so we can call it later
    // after adding our logging logic around it. This preserves the original
    // behavior while enhancing it with logging capabilities.
    const originalMethod = descriptor.value;

    // We replace the original method with a new function that includes logging.
    // This new function will be called whenever the decorated method is invoked,
    // allowing us to log before and after the original logic executes.
    descriptor.value = async function (...args: any[]) {
      // We retrieve the logger instance from the handler using the provided property key.
      // The logger should be injected into the handler through its constructor,
      // typically as a dependency that implements the ILogger interface.
      // the reason we cannot inject it directly into the decorator is that decorators
      // are applied at design time, before instances are created, so we access it
      // from the instance (this) at runtime.
      const logger = this[loggerPropertyKey];

      // We derive the operation name automatically from the class name to avoid generic names like "execute"
      const operationName = target.constructor.name
        .replace('Handler', '')
        .replace('Query', '')
        .replace('Command', '');

      // We also retrieve the use case description from the handler instance.
      // This use case string describes what business operation is being performed
      // and provides context for the log messages, making them more meaningful.
      const useCase = this.useCase || operationName;

      // We record the start time to calculate how long the operation takes.
      // This duration metric is valuable for performance monitoring and can
      // help identify slow operations that might need optimization.
      const startTime = Date.now();

      // We log the beginning of the operation with relevant context information.
      // This helps trace the execution flow when analyzing logs later.
      logger?.log(`Starting ${operationName} execution`, {
        useCase,
        timestamp: new Date().toISOString(),
        handler: target.constructor.name,
      });

      try {
        // We execute the original method with the provided arguments.
        // This is where the actual business logic runs, and we await its
        // completion to handle both synchronous and asynchronous operations.
        const result = await originalMethod.apply(this, args);

        // We calculate how long the operation took by comparing the current
        // time with the start time we recorded before the execution began.
        const duration = Date.now() - startTime;

        if (Either.isEither(result)) {
          if (result.isLeft()) {
            const errorData = result.getLeft();

            // Usamos tu Type Guard centralizado para asegurar el tipado de ErrorData
            if (isErrorData(errorData)) {
              // If the result is a Left (error), we log the error details.
              // We pass an object with the error properties instead of the error object itself
              // to prevent the logger from printing an unformatted stack trace,
              // as the ErrorData already handled its own detailed output.
              logger?.errorResult(
                `Operation ${operationName} failed: ${errorData.message}`,
                {
                  errorCode: errorData.code,
                  errorId: errorData.errorId,
                  duration: `${duration}ms`,
                  layer: errorData.layer,
                  handler: target.constructor.name,
                  useCase,
                },
              );
            } else {
              // Fallback en caso de que el error no cumpla con la estructura de ErrorData
              logger?.error(
                `Operation ${operationName} failed with an unknown error type`,
                {
                  error: String(errorData),
                  duration: `${duration}ms`,
                  handler: target.constructor.name,
                },
              );
            }
          } else {
            // We log the successful completion of the operation along with its duration.
            logger?.log(`Completed ${operationName} successfully`, {
              useCase,
              timestamp: new Date().toISOString(),
              duration: `${duration}ms`,
              handler: target.constructor.name,
            });
          }

          // We return the original result to ensure the decorator doesn't change
          // the behavior of the method beyond adding logging. The caller receives
          // exactly what the original method would have returned.
          return result;
        }

        // We log the successful completion of the operation along with its duration.
        logger?.log(`Completed ${operationName} successfully`, {
          useCase,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          handler: target.constructor.name,
        });

        // We return the original result to ensure the decorator doesn't change
        // the behavior of the method beyond adding logging. The caller receives
        // exactly what the original method would have returned.
        return result;
      } catch (error) {
        // If an error occurs during execution, we calculate the duration up to
        // the point of failure and log the error with all available context.
        // This includes the error message and stack trace for debugging.
        const duration = Date.now() - startTime;

        // We log the error with metadata that helps identify what went wrong
        // and under what conditions. This information is crucial for fixing
        // bugs and understanding failure patterns in production.
        logger?.error(`Failed during ${operationName} execution`, error, {
          useCase,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          handler: target.constructor.name,
        });

        // We re-throw the original error to ensure the decorator doesn't swallow
        // exceptions. The caller still receives the error and can handle it
        // according to its own error handling strategy.
        throw error;
      }
    };

    // We return the modified descriptor so TypeScript knows we've changed
    // the method's implementation. This is required by the decorator pattern.
    return descriptor;
  };
}
