/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\i-error-socket.interface.ts

// 1. El payload (lo que recibe el cliente)
export interface ISocketErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  errorId: string;
}

// 2. El envoltorio (lo que usa el backend para saber qué emitir)
export interface IMappedSocketError {
  event: string;
  data: ISocketErrorResponse;
}
