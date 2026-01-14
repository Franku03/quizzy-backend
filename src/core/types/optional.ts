/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\types\optional.ts

export class Optional<T> {
  private value: T | undefined;
  private assigned: boolean;

  constructor(value?: T) {
    if (value) {
      this.value = value;
      this.assigned = true;
    } else {
      this.value = undefined;
      this.assigned = false;
    }
  }

  public hasValue(): boolean {
    return this.assigned;
  }

  public getValue(): T {
    if (!this.assigned) {
      throw new Error('Cannot get value from an empty Optional.');
    }
    return this.value as T;
  }

  static isOptional(obj: unknown): obj is Optional<unknown> {
    return obj instanceof Optional;
  }
}
