/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\abstractions\aggregate.root.ts

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

export abstract class AggregateRoot<TProps, TId extends UuidVO> extends Entity<
  TProps,
  TId
> {
  protected constructor(properties: TProps, id: TId) {
    super(properties, id);
  }

  protected abstract checkInvariants(): void;

  /*public abstract toPrimitives(): TProps & { id: string };*/
}
