/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\context\base-multiplayer-session-context.ts

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