// src/core/errors/types/domain-error-context.type.ts
import { IErrorContext } from "./i-error-context.interface";

/**
 * Contexto de error canónico para la capa DOMAIN.
 * Extiende la interfaz común para mantener consistencia
 */
export interface IDomainErrorContext extends IErrorContext {
    // El TIPO de objeto o agregado afectado
    domainObjectType: string; 
    
    // Identificador único del objeto de dominio
    domainObjectId?: string;
    
    // Identificador de la entidad o actor que inició la acción
    actorId?: string; 
    
    // La INTENCIÓN de la operación que falló
    intendedAction?: string;
    
    // NOTA: operation, adapterName, portName ya vienen de IErrorContext
    // [key: string]: any también viene de IErrorContext
}