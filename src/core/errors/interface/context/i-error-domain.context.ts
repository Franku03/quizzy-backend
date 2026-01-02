// src/core/errors/types/domain-error-context.type.ts

import { IErrorContext } from "./i-error-context.interface";

export interface IDomainErrorContext extends IErrorContext {
    // TÉCNICO: Qué clase falló? (Ej: 'VisibilityStatus')
    domainObjectType: string; 
    
    // TÉCNICO: Qué nivel es? (Ej: 'ValueObject')
    domainObjectKind?: 'ValueObject' | 'Entity' | 'AggregateRoot' | 'DomainService';
    
    // TÉCNICO: ID del objeto que falló (Si es una Slide, su ID. Si es un VO, vacío)
    domainObjectId?: string;
    
    // NEGOCIO: El nombre del Agregado (Ej: 'Kahoot')
    rootAggregateName?: string;
    
    // NEGOCIO: El ID del Agregado (El UUID del Kahoot)
    rootAggregateId?: string;

    actorId?: string; 
}