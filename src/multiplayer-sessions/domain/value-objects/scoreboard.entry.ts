import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerId } from "./player.id";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";

interface ScoreboardEntryProps {
    playerId: PlayerId,
    nickname: string,
    score: number,
    rank: number  
}

export class ScoreboardEntry extends ValueObject<ScoreboardEntryProps>{


    private constructor( props: ScoreboardEntryProps){

        super({...props})

    }

    public static create(        
        playerId: PlayerId,
        nickname: string,
        score: number,
        rank: number
    ): ScoreboardEntry {

        const nicknameValidation = validateNicknameInvariants( nickname );

        if( !nicknameValidation.isValid ) {

            throw new Error( nicknameValidation.error );

        } 

        if( !Number.isInteger( rank )){
            throw new Error('El número de ranking debe ser un número entero');

        }

        
        if( rank <= 0 ){
            throw new Error('El número de ranking debe ser un número mayor a 0');
        }
            
        return new ScoreboardEntry({ playerId, nickname, score, rank });
        
    }


    public getPlayerId(): PlayerId {
        return this.properties.playerId;
    }

    public getNickname(): string {
        return this.properties.nickname;
    }

    public getScore(): number {
        return this.properties.score
    }

    public getRank(): number{
        return this.properties.rank;
    }



}