import { Entity } from "src/core/domain/abstractions/entity";
import { PlayerId } from "../value-objects";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { validateNicknameInvariants } from "../helpers/validate-nickname-invariants";


interface PlayerProps {
    nickname: string;  
    score: Score;  
    streak: number;
    isGuest: boolean;       
}

export class Player extends Entity<PlayerProps, PlayerId> {

    public constructor(
        playerId: PlayerId,
        nickname: string,
        score: Score,
        streak: number = 0,
        isGuest: boolean
    ){    
        super({ nickname, score, isGuest, streak }, playerId);
    }


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

    public updateStreak( lastAnswerWasCorrect: boolean ): void {

        if( lastAnswerWasCorrect ){

            this.properties.streak++

        }else{

            this.properties.streak = 0;

        }

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

    public getStreak(): number {

        return this.properties.streak;

    }

    public isGuest(): boolean {
        return this.properties.isGuest;
    }


}