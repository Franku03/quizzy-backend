/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\mapper\i-error-http-mapper-service.interface.ts

import { ErrorData } from '../../error.type';
import { IErrorResponse } from '../i-error-response.interface';

/**
 * Contrato para servicios que mapean ErrorData a respuestas HTTP
 * Aplicando DIP: El filtro global depende de esta abstracción
 */
export interface IErrorService {
  /**
   * Convierte un ErrorData interno a una respuesta para el cliente
   */
  toClientResponse(errorData: ErrorData): IErrorResponse;
}
