// src/kahoots/application/commands/base/kahoot-context.helper.ts

import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

export const createKahootAppContext = (operation: string, aggregateId?: string, actorId?: string) => {
    return createDomainContext(
        'Kahoot',
        operation,
        {
            rootAggregateName: 'Kahoot',
            rootAggregateId: aggregateId,
            actorId: actorId,
        }
    );
};