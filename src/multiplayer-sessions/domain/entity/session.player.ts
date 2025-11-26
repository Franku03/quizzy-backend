import { Entity } from "src/core/domain/abstractions/entity";
import { PlayerId } from "../value-objects";

interface PlayerProps {
    readonly id: PlayerId;       
    nickname: string;  
    // score: Score; 
    score: number;         
        
}

export class Player extends Entity<PlayerProps, PlayerId> {

}