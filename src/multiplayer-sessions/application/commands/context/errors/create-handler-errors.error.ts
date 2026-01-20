/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\context\errors\create-handler-errors.error.ts

import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { COMMON_ERRORS } from './common.errors';

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


export const createNoValidOptionFound = (operation: string, aggregateId?: string, actorId?: string ) => {

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
        COMMON_ERRORS.NO_VALID_OPTION
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


export const createInvalidSyncStateError = (operation: string, aggregateId?: string, sessionPin?: string) => {

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
        COMMON_ERRORS.SESSION_INVALID_SYNC_STATE
    )


};