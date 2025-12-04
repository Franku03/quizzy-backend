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

export abstract class ValueObject<T extends object> {
    
    protected constructor(protected readonly properties: T) {
        // https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
        Object.freeze(this.properties);
    }

    public equals(vo?: ValueObject<T>): boolean {
        //Verificación de existencia 
        if (vo === null || vo === undefined) {
            return false;
        }
        //Verificación de tipo (solo son iguales VOs de la misma clase por ello comparamos constructores)
        if (vo.constructor !== this.constructor) {
            return false;
        }
        //Verificación profunda del contenido (Valor)
        return this.deepEqual(this.properties, vo.properties);
    }
    
    private deepEqual(a: any, b: any, visited = new WeakMap<any, any>()): boolean {
        // Referential equality & primitives
        if (a === b) {
            return true;
        }

        // Null/Undefined checks
        if (a === null || a === undefined || b === null || b === undefined) {
            return false;
        }

        // Primitive mismatch (e.g. "5" vs 5)
        // Also handles functions or symbols if they weren't caught by strict equality
        if (typeof a !== 'object' || typeof b !== 'object') {
            return false;
        }

        // --- At this point, 'a' and 'b' are guaranteed to be non-null Objects ---

        // Constructor Mismatch
        // Essential for DDD: Ensures a 'UserId' doesn't equal an 'OrderId'
        // Also ensures Array doesn't equal Object
        if (a.constructor !== b.constructor) {
            return false;
        }

        // Circular Reference Check
        if (visited.has(a)) {
            return visited.get(a) === b;
        }
        visited.set(a, b);

        // Special Case: ValueObject
        // Check this FIRST to avoid the ".equals" infinite recursion trap
        if (a instanceof ValueObject) {
            return this.deepEqual(a.getProperties(), b.getProperties(), visited);
        }

        // Special Case: Date
        if (a instanceof Date) {
            return a.getTime() === b.getTime();
        }

        // Special Case: RegExp
        if (a instanceof RegExp) {
            return a.toString() === b.toString();
        }

        // Special Case: Map
        if (a instanceof Map) {
            if (a.size !== b.size) return false;
            for (const [key, val] of a) {
                if (!b.has(key)) return false;
                // Note: Map keys are compared strictly by reference usually, 
                // but values need deep comparison
                if (!this.deepEqual(val, b.get(key), visited)) return false;
            }
            return true;
        }

        // Special Case: Sets
        if (a instanceof Set) {
            if (a.size !== b.size) return false;
            // Sets are harder to deep compare because they don't have keys. 
            // Typically strict iteration is enough, or converting to array.
            const arrayA = Array.from(a);
            const arrayB = Array.from(b);
            return this.deepEqual(arrayA, arrayB, visited);
        }

        // Generic .equals() method support
        // (Only if it's NOT a ValueObject, handled in step 6)
        if (typeof a.equals === 'function') {
            return a.equals(b);
        }

        // Arrays
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEqual(a[i], b[i], visited)) return false;
            }
            return true;
        }

        // Plain Objects (or objects without specific handlers)
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(b, key)) {
                return false;
            }
            if (!this.deepEqual(a[key], b[key], visited)) {
                return false;
            }
        }

        return true;
    }

    public getProperties(): T {
        return this.properties;
    }
}