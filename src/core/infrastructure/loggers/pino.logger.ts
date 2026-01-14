/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\loggers\pino.logger.ts

// core/infrastructure/loggers/pino.logger.ts

import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

// This is the concrete implementation of the ILogger interface using the Pino library.
// It belongs to the infrastructure layer and handles the technical details of logging
// such as formatting, transport, and persistence. The application layer remains unaware
// of these implementation details, maintaining separation of concerns.
export class PinoLogger implements ILogger {
  private readonly logger: pino.Logger;

  constructor() {
    // We configure the logger to write to both console and file simultaneously.
    // The console output is formatted for human readability during development,
    // while the file output preserves structured logs for production analysis.

    // Create logs directory if it doesn't exist
    const logDir = path.join(process.cwd(), 'logs');

    // Ensure directory exists synchronously before creating transport
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transport = pino.transport({
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        {
          target: 'pino/file',
          options: {
            // We use absolute path
            destination: path.join(logDir, 'app.log'),
            mkdir: true,
          },
        },
      ],
    });

    // error handling for transport
    transport.on('error', (err) => {
      console.error('Pino transport error:', err);
    });

    // Create the Pino logger instance with the transport
    this.logger = pino(
      {
        level: 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      transport,
    );
  }

  log(message: string, metadata?: Record<string, any>): void {
    // When logging informational messages, we include any provided metadata
    // as structured data that can be queried later. This helps with debugging
    // and monitoring by providing context around what was happening.
    if (metadata) {
      this.logger.info(metadata, message);
    } else {
      this.logger.info(message);
    }
  }

  error(message: string, error?: any, metadata?: Record<string, any>): void {
    // Error logging includes both the error message and the actual error object.
    // The error object contains stack traces and other debugging information
    // that are crucial for identifying and fixing issues in production.
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    this.logger.error(errorMetadata, message);
  }

  errorResult(message: string, metadata?: Record<string, any>): void {
    // This method handles controlled application errors (Domain/Application results).
    // Unlike the standard error method, it does not expect an exception object,
    // avoiding unnecessary stack traces and keeping logs clean for business-rule violations.
    // The metadata provides the necessary context for auditing and troubleshooting.
    if (metadata) {
      this.logger.error(metadata, message);
    } else {
      this.logger.error(message);
    }
  }
}
