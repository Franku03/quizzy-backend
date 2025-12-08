// src/shared/errors/helpers/domain-error-context.helper.ts
import { IDomainErrorContext } from "../interface/context/i-error-domain.context";

export const createDomainContext = (
    domainObjectType: string,
    operation: string,
    params?: {
        domainObjectId?: string;
        actorId?: string;
        intendedAction?: string;
        [key: string]: any;
    }
): IDomainErrorContext => {
    return {
        operation,
        domainObjectType,
        domainObjectId: params?.domainObjectId,
        actorId: params?.actorId,
        intendedAction: params?.intendedAction || operation,
        ...params,
    };
};