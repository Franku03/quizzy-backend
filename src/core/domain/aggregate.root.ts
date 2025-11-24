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

import { Entity } from './entity'; 
import { UuidVO } from './vo.id'; 

export abstract class AggregateRoot<TProps, TId extends UuidVO> extends Entity<TProps, TId> {

    protected constructor(properties: TProps, id: TId) {
        super(properties, id);
    }

    protected abstract checkInvariants(): void;

    public abstract toPrimitives(): TProps & { id: string };
}