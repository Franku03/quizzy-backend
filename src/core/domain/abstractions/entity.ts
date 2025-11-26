//NOTA: Para trabajar con esta clase la idea es que se defina una interfaz que defina las propiedades de la Entity
//y se pase como parámetro genérico TProps al Entity<TProps, TId>

//Ejemplo:

/*
interface UserProps {
    readonly id: UserId;       
    readonly name: UserName;  
    isActive: boolean;         
}
*/

import { UuidVO } from './vo.id'; 

export abstract class Entity<TProps, TId extends UuidVO> { 

    public readonly id: TId; 
    protected properties: TProps; 

    protected constructor(properties: TProps, id: TId) {
        if (!id) {
            throw new Error("El ID de la Entidad no puede ser null.");
        }
        this.id = id;
        this.properties = properties;
    }

    public equals(entity?: Entity<TProps, TId>): boolean {
        if (!entity || entity.constructor !== this.constructor) {
            return false;
        }
        return this.id.equals(entity.id);
    }


    public idToString(): string {
        return this.id.value; 
    }
    
    /*public abstract toPrimitives(): TProps & { id: string };*/
}