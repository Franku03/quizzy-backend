import { Entity } from "src/core/domain/abstractions/entity";
import { PlayerId } from "../value-objects";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";


interface PlayerProps {
    nickname: string;  
    score: Score;         
}

export class Player extends Entity<PlayerProps, PlayerId> {

    constructor(
        playerId: PlayerId,
        nickname: string,
        score: Score
    ){


        if( nickname.trim().length === 0 )
            throw new Error("El nickname del usuario no puede estar vacío");        

        super({ nickname, score }, playerId);
    }


    public changeNickname( newNickname: string ): void {
        this.properties.nickname = newNickname;
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