
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerId } from "../value-objects";
import { Player } from "../entity/session.player";

import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";

export class PlayerFactory {

    public static createPlayerForSession(
        userId: string,
        nickname: string,
        isGuest: boolean,
    ): Player {

        const { cleanNickname, isValid, error } = validateNicknameInvariants( nickname );

        if( !isValid ) {

            throw new Error( error );

        }

        const playerId = new PlayerId( userId );

        const baseScore = Score.create( 0 );

        return new Player( playerId , cleanNickname, baseScore, isGuest );

    }

}