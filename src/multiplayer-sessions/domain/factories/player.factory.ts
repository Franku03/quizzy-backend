/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\factories\player.factory.ts

import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerId } from "../value-objects";
import { Player } from "../entity/session.player";

import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";

import { Either, ErrorData } from "src/core/types";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class PlayerFactory {

    public static createPlayerForSession(
        userId: string,
        nickname: string,
        isGuest: boolean,
    ): Either<ErrorData, Player> {

        const { cleanNickname, isValid, errorMessage } = validateNicknameInvariants( nickname );

        if( !isValid ) {

            return Either.makeLeft(DomainErrorFactory.validation(
                createDomainContext('PlayerFactory', 'Factory', { actorId: userId, domainObjectKind: 'Entity', rootAggregateName: 'MultiplayerSession'}),
                { playerNickname: ['INVALID_NICKNAME'] },
                errorMessage
            ));

        }

        const playerId = new PlayerId( userId );

        const baseScore = Score.create( 0 );

        const player = new Player( playerId , cleanNickname, baseScore, 0, isGuest ) // El streak inicial está en 0 por default

        return Either.makeRight( player ); 

    }

}