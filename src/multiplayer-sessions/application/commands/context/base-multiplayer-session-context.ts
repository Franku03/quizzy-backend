import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
export const createMultiplayerSessionAppContext = (operation: string, aggregateId?: string, actorId?: string, sessionPin?: string) => {
    return createDomainContext(
        'MultiplayerSession',
        operation,
        {
            rootAggregateName: 'MultiplayerSession',
            rootAggregateId: aggregateId,
            sessionPin: sessionPin ?? "UNAVAILABLE AT SESSION CREATION",
            actorId: actorId,
        }
    );
};