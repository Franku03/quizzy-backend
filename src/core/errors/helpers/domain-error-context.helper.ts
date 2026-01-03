// src/shared/errors/helpers/domain-error-context.helper.ts
import { IDomainErrorContext } from "../interface/context/i-error-domain.context";

export const createDomainContext = (
    domainObjectType: string,
    operation?: string,
    params?: {
        domainObjectId?: string;
        actorId?: string;
        domainObjectKind?: 'ValueObject' | 'Entity' | 'AggregateRoot' | 'DomainService';
        rootAggregateName?: string;
        rootAggregateId?: string;
        [key: string]: any;
    }
): IDomainErrorContext => {
    return {
        operation,
        domainObjectType,
        domainObjectId: params?.domainObjectId,
        actorId: params?.actorId,
        domainObjectKind: params?.domainObjectKind,
        rootAggregateName: params?.rootAggregateName,
        rootAggregateId: params?.rootAggregateId,
        ...params,
    };
};