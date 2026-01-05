// src/core/errors/helpers/application-error-context.helper.ts
import { IApplicationErrorContext } from "../interface/context/i-error-application.context";

export const createApplicationContext = (
    operation: string, 
    params?: {
        actorId?: string;
        resourceTargetId?: string;
        resourceType?: string;
        [key: string]: any; // Permite metadatos extra si son necesarios
    }
): IApplicationErrorContext => {
    return {
        operation,
        actorId: params?.actorId,
        resourceTargetId: params?.resourceTargetId,
        resourceType: params?.resourceType,
        ...params,
    };
};