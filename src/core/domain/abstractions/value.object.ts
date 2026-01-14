/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\abstractions\value.object.ts

//NOTA: Para trabajar con esta clase la idea es que se defina una interfaz que defina las propiedades del VO
//y se pase como parámetro genérico T al ValueObject<T>

//Ejemplo:

/*
interface User {
    firstName: string;
    lastName: string;
}

class UserName extends ValueObject<User> {
    constructor(firstName: string, lastName: string) {
       super({ firstName, lastName });
    }
}*/

/**
 * MIT License | Copyright (c) 2025
 */

export abstract class ValueObject<T extends object> {
  protected constructor(protected readonly properties: T) {
    Object.freeze(this.properties);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === undefined) {
      return false;
    }
    // Comparamos prototipos de forma segura
    if (Object.getPrototypeOf(vo) !== Object.getPrototypeOf(this)) {
      return false;
    }
    return this.deepEqual(this.properties, vo.properties);
  }

  private deepEqual(
    a: unknown,
    b: unknown,
    visited = new WeakMap<object, unknown>(),
  ): boolean {
    if (a === b) return true;

    if (a === null || a === undefined || b === null || b === undefined) {
      return false;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }

    // --- A partir de aquí, 'a' y 'b' son objetos no nulos ---
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    if (objA.constructor !== objB.constructor) {
      return false;
    }

    if (visited.has(objA)) {
      return visited.get(objA) === objB;
    }
    visited.set(objA, objB);

    // Special Case: ValueObject
    if (a instanceof ValueObject && b instanceof ValueObject) {
      return this.deepEqual(a.getProperties(), b.getProperties(), visited);
    }

    // Special Case: Date
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Special Case: RegExp
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // Special Case: Map
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, val] of a) {
        if (!b.has(key)) return false;
        if (!this.deepEqual(val, b.get(key), visited)) return false;
      }
      return true;
    }

    // Special Case: Sets
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      return this.deepEqual(Array.from(a), Array.from(b), visited);
    }

    // Generic .equals() method support (Solo si existe en ambos)
    if (
      typeof (a as { equals?: unknown }).equals === 'function' &&
      typeof (b as { equals?: unknown }).equals === 'function'
    ) {
      return (a as { equals: (other: unknown) => boolean }).equals(b);
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i], visited)) return false;
      }
      return true;
    }

    // Plain Objects
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
      if (!this.deepEqual(objA[key], objB[key], visited)) return false;
    }

    return true;
  }

  public getProperties(): T {
    return this.properties;
  }
}
