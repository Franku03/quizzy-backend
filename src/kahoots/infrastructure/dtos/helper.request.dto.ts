/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\helper.request.dto.ts

export const cleanNullToUndefined = ({ value }: { value: any }) => value === null ? undefined : value;

export function toUpperCase(params: { value: any }): string | undefined | null {
  const value = params.value;
  if (typeof value !== 'string' || !value) {
    return value;
  }
  return value.toUpperCase();
}
