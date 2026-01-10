import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { COMMON_ERRORS } from '../../common.errors';
import { createApplicationContext } from 'src/core/errors/helpers/app-error-context.helper';
import { AppErrorFactory } from 'src/core/errors/factories/app-error.factory';
export const createSlideNotFoundError = (operation: string, aggregateId?: string, actorId?: string ) => {

    const ctx = createDomainContext(
        'Kahoot',
        operation,
        {
            rootAggregateName: 'Kahoot',
            rootAggregateId: aggregateId,
            domainObjectKind: 'AggregateRoot',
            actorId: actorId,
        }
    );


    return DomainErrorFactory.notFound(
        ctx,
        COMMON_ERRORS.SLIDE_NOT_FOUND
    )



};


export const createOptionNotFoundError = (operation: string, aggregateId?: string, actorId?: string ) => {

    const ctx = createDomainContext(
        'Kahoot',
        operation,
        {
            rootAggregateName: 'Kahoot',
            rootAggregateId: aggregateId,
            domainObjectKind: 'AggregateRoot',
            actorId: actorId,
        }
    );


    return DomainErrorFactory.notFound(
        ctx,
        COMMON_ERRORS.NO_OPTIONS
    )



};


export const createResponseNotGeneratedError = (operation: string, actorId?: string, resourceId?: string, resourceTypeId?: string ) => {

    const ctx = createApplicationContext(
        operation,
        {
            actorId: actorId,
            resourceTargetId: resourceId,
            resourceType:resourceTypeId,
        }
    );


    return AppErrorFactory.notFound(
        ctx
    )

};

export const createInvalidTransitionStateError = (operation: string, aggregateId?: string, sessionPin?: string) => {

    const ctx = createDomainContext(
        'MultiplayerSession',
        operation,
        {
            rootAggregateName: 'MultiplayerSession',
            rootAggregateId: aggregateId,
            domainObjectKind: 'AggregateRoot',
            sessionPin: sessionPin,
        }
    );


    return DomainErrorFactory.notFound(
        ctx,
        COMMON_ERRORS.SESSION_INVALID_STATE
    )


};