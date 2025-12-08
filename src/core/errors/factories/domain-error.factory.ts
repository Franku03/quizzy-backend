// src/shared/errors/domain-error.factory.ts
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IDomainErrorContext } from '../interface/context/i-error-domain.context';

export class DomainErrorFactory {

    /**
     * Crea ErrorData: Recurso no encontrado (Ej: 404).
     * Se usa cuando una Entidad o Agregado referenciado no existe.
     */
    static notFound(
        context: IDomainErrorContext,
        message?: string
    ): ErrorData {
        const defaultMsg = `${context.domainObjectType} with ID "${context.domainObjectId}" not found.`;
        
        return new ErrorData(
            "RESOURCE_NOT_FOUND",
            message || defaultMsg,
            ErrorLayer.DOMAIN,
            { ...context, errorCategory: 'NOT_FOUND' }
        );
    }

    /**
     * Crea ErrorData: Acceso no autorizado (Ej: 403).
     * Se usa cuando el actor (usuario) no cumple las reglas de propiedad/permisos.
     */
    static unauthorized(
        context: IDomainErrorContext,
        message?: string
    ): ErrorData {
        const defaultMsg = `Actor ${context.actorId} not authorized to ${context.intendedAction} resource ${context.domainObjectType}.`;

        return new ErrorData(
            "UNAUTHORIZED_ACCESS",
            message || defaultMsg,
            ErrorLayer.DOMAIN,
            { ...context, errorCategory: 'UNAUTHORIZED' }
        );
    }

    /**
     * Crea ErrorData: Fallo de validación de reglas de negocio (Ej: 400).
     * Se usa cuando un VO o una regla de negocio compleja falla.
     */
    static validation(
        context: IDomainErrorContext,
        validationDetails: Record<string, string[]>,
        message?: string
    ): ErrorData {
        const defaultMsg = `Validation failed for ${context.domainObjectType}.`;

        return new ErrorData(
            "INVALID_DATA",
            message || defaultMsg,
            ErrorLayer.DOMAIN,
            { 
                ...context, 
                validationDetails: validationDetails, 
                errorCategory: 'VALIDATION' 
            }
        );
    }
    
    /**
     * Crea ErrorData: Conflicto de estado (Ej: 409).
     * Se usa para errores como duplicados, estado incorrecto o conflictos de concurrencia optimista.
     */
    static conflict(
        context: IDomainErrorContext,
        conflictType: 'DUPLICATE' | 'STATE' | 'CONCURRENCY',
        message?: string
    ): ErrorData {
        const defaultMsg = `${conflictType} conflict in ${context.domainObjectType}.`;
        
        return new ErrorData(
            `${conflictType}_CONFLICT`,
            message || defaultMsg,
            ErrorLayer.DOMAIN,
            { ...context, conflictType, errorCategory: 'CONFLICT' }
        );
    }
}