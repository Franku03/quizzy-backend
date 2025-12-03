    // TODO: Relacionar con el UserId cuando el modulo de usuarios exista, deben haber dos metodos de creacion de player, uno para cuando es usuario registrado y otro para cuando no lo es
    // id: UserId | string;

import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerId } from "../value-objects";
import { Player } from "../entity/session.player";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";

import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";

export class PlayerFactory {

    // Para crear Registro de jugadores que se unen teniendo una cuenta en la aplicacion
    public static createPlayerFromExistingUser(
        
        userId: UserId, 
        nickname: string, 

    ): Player {

        const { cleanNickname, isValid, error } = validateNicknameInvariants( nickname );

        if( !isValid ) {

            throw new Error( error );

        } 

        const playerId = new PlayerId( userId.value );

        const baseScore = Score.create( 0 );


        return new Player( playerId , cleanNickname, baseScore );

    }

    // Para crear Registro de jugadores que se unen como invitados
    public static createPlayerForNonexistentUser(
        
        nonUserId: string , 
        nickname: string, 

    ): Player {

        const { cleanNickname, isValid, error } = validateNicknameInvariants( nickname );
        

        if( !isValid ) {

            throw new Error( error );

        } 

        const playerId = new PlayerId( nonUserId );

        const baseScore = Score.create( 0 );

        return new Player( playerId , cleanNickname, baseScore );

    }

}