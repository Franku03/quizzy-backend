import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

export interface sessionInfo {

    aggregateId?: string,
    actorId?: string,
    sessionPin?: string,
    tokenId?: string,

}

export const createMultiplayerSessionAppContext = (operation: string, sessionInfo: sessionInfo ) => {
    return createDomainContext(
        'MultiplayerSession',
        operation,
        {
            rootAggregateName: 'MultiplayerSession',
            rootAggregateId: sessionInfo.aggregateId,
            sessionPin: sessionInfo.sessionPin ?? "UNAVAILABLE AT OPERATION",
            actorId: sessionInfo.actorId        
        }
    );
};