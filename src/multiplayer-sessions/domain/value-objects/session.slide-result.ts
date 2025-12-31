import { ValueObject } from "src/core/domain/abstractions/value.object"
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id"
import { PlayerId } from "./player.id"
import { SessionPlayerAnswer } from "./slide-result.session-player-answer"

import { PlayerIdValue } from "../types/id-value.types"

interface SlideResultProps {
    slideId: SlideId,
    answers: Map<PlayerIdValue, SessionPlayerAnswer >
}

export class SlideResult extends ValueObject<SlideResultProps> {
    

    public constructor( props: SlideResultProps ){
        super({ ...props });
    }


    public static create ( slideId: SlideId ): SlideResult {

        const answers: Map<PlayerIdValue, SessionPlayerAnswer> = new Map();

        return new SlideResult({ slideId, answers });

    }


    public addResult ( playerAnswer: SessionPlayerAnswer ): SlideResult {

        if( this.properties.answers.has( playerAnswer.getPlayerId().value ) )
            throw Error('El jugador ya tiene una respuesta asociada a esta Slide, no puede añadir otra');

        const updatedAnswers: Map<PlayerIdValue, SessionPlayerAnswer> = new Map();

        for( const [playerId, playerAnswer] of this.properties.answers ){
            
            updatedAnswers.set( playerId, playerAnswer );
        }

        updatedAnswers.set( playerAnswer.getPlayerId().value, playerAnswer );

        return new SlideResult({ slideId: this.properties.slideId , answers: updatedAnswers });

    }

    public searchPlayerAnswer(playerId: PlayerId ): SessionPlayerAnswer | undefined {

        if( !this.properties.answers.has( playerId.value ) )
            return undefined;

        return this.properties.answers.get( playerId.value )!

    }


    public getSlideId(): SlideId {

        return this.properties.slideId;

    }


    public getPlayersAnswers(): SessionPlayerAnswer[] {

        return [ ...this.properties.answers.values() ];

    }

}