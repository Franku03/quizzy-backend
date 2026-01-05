// src/core/errors/factories/application-error.factory.ts
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IApplicationErrorContext } from '../interface/context/i-error-application.context';

export class AppErrorFactory {

    static notFound(context: IApplicationErrorContext): ErrorData {
        const message = `${context.resourceType || 'Resource'} with ID "${context.resourceTargetId || 'unknown'}" not found.`;
        
        return new ErrorData(
            "RESOURCE_NOT_FOUND",
            message,
            ErrorLayer.APPLICATION,
            { ...context, errorCategory: 'NOT_FOUND' }
        );
    }

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
}