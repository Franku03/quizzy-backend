/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\helper.request.dto.ts

/**
 * Transforma valores null a undefined de forma segura usando genéricos.
 */
export const cleanNullToUndefined = <T>({
  value,
}: {
  value: T;
}): T | undefined => ((value as unknown) === null ? undefined : value);

/**
 * Convierte un valor a mayúsculas si es un string, manteniendo el tipo original si no lo es.
 */
export function toUpperCase(params: { value: unknown }): unknown {
  const { value } = params;

  if (typeof value !== 'string' || !value) {
    return value;
  }

  return value.toUpperCase();
}
