import { Entity } from "src/core/domain/abstractions/entity";
import { PlayerId } from "../value-objects";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";


interface PlayerProps {
    nickname: string;  
    score: Score;         
}

export class Player extends Entity<PlayerProps, PlayerId> {

    public constructor(
        playerId: PlayerId,
        nickname: string,
        score: Score
    ){    
        super({ nickname, score }, playerId);
    }

    // * Vieja factory method, se reemplazo por una fabrica dedicada

    // public create(playerId: PlayerId, nickname: string, score: Score): Player {

    //     const nicknameValidation = validateNicknameInvariants( nickname );

    //     if( !nicknameValidation.isValid ) {

    //         throw new Error( nicknameValidation.error );

    //     } 
     
    //     return new Player( playerId , nickname, score );
    // }


    public changeNickname( newNickname: string ): void {

        const { cleanNickname, isValid, error } = validateNicknameInvariants( newNickname );

        if( !isValid ) {

            throw new Error( error );

        } 

        this.properties.nickname = cleanNickname;
    }

    public updateScore( updatedScore: Score): void {
        this.properties.score = updatedScore;
    }


    public getPlayerId(): string {
        return this.idToString();
    }

    public getPlayerNickname(): string {
        return this.properties.nickname;
    }
 
    public getScore(): number {

        return this.properties.score.getScore();

    }


}