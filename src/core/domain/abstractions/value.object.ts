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
    
    private deepEqual(a: any, b: any): boolean {

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            
            const propA = a[key]; 
            const propB = b[key]; 
            
            if (propA === null || propB === null) {
                if (propA !== propB) return false;
                continue; 
            }
            
            // Si un objeto anidado es un VO, debe tener su propio
            // método 'equals'. Delegamos la responsabilidad de la igualdad a ese objeto.
            // Esto sucederia si un VO tiene como objeto otro VO (no c cuando podria ocurrir pero mejor prevenir)
            if (propA.equals && propB.equals) {
                if (!propA.equals(propB)) return false;
            } 

            // Verificación de Objetos Literales o Arrays (Necesitan Recursión)
            // Si no fue manejado como un VO y tiene un constructor de objeto, 
            // asumimos que es un objeto complejo (Object literal, Array, Map, etc.) y aplicamos la recursión.
            else if (propA?.constructor === Object || propA?.constructor !== undefined) {
                
                if (!this.deepEqual(propA, propB)) {
                    return false;
                }
            } 

            // Si llegamos aquí, se asume que son primitivos y se comparan directamente.
            else if (propA !== propB) {
                return false;
            }
        }

        return true;
    }

    public getProperties(): T {
        return this.properties;
    }
}