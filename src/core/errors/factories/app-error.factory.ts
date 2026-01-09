import { ErrorData, ErrorLayer } from 'src/core/types';
import { IApplicationErrorContext } from '../interface/context/i-error-application.context';

export class AppErrorFactory {

    /**
     * REGLA: Se usa cuando el identificador proporcionado no existe en la persistencia.
     */
    static notFound(context: IApplicationErrorContext): ErrorData {
        const message = `${context.resourceType || 'Resource'} with ID "${context.resourceTargetId || 'unknown'}" not found.`;
        
        return new ErrorData(
            "RESOURCE_NOT_FOUND",
            message,
            ErrorLayer.APPLICATION,
            { ...context, errorCategory: 'NOT_FOUND' }
        );
    }

    /**
     * REGLA: Se usa cuando el actor está autenticado pero no tiene la identidad (Ownership) 
     * o el rol necesario para modificar un recurso específico.
     */
    static unauthorized(context: IApplicationErrorContext): ErrorData {
        const opName = context.operation || 'the requested action';
        const resource = context.resourceType || 'resource';
        const id = context.resourceTargetId ? ` (${context.resourceTargetId})` : '';

        const message = `Actor ${context.actorId || 'anonymous'} is not authorized to execute ${opName} on ${resource}${id}`.trim();

        return new ErrorData(
            "UNAUTHORIZED_ACCESS",
            message,
            ErrorLayer.APPLICATION,
            { ...context, errorCategory: 'UNAUTHORIZED' }
        );
    }

    /**
     * REGLA: Se usa cuando la acción está prohibida por el estado interno del recurso (Draft)
     * o por políticas de negocio inflexibles, independientemente de la identidad del actor.
     */
    static forbidden(context: IApplicationErrorContext, reason: string): ErrorData {
        const message = `Access Forbidden: ${reason}. (${context.resourceType || 'Resource'} ID: ${context.resourceTargetId || 'unknown'})`;

        return new ErrorData(
            "ACCESS_FORBIDDEN",
            message,
            ErrorLayer.APPLICATION,
            { ...context, errorCategory: 'FORBIDDEN', reason }
        );
    }
}