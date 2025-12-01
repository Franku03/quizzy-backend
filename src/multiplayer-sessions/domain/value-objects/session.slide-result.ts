import { ValueObject } from "src/core/domain/abstractions/value.object"
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id"
import { PlayerId } from "./player.id"
import { SessionPlayerAnswer } from "./slide-result.session-player-answer"

interface SlideResultProps {
    slideId: SlideId,
    answers: Map<PlayerId, SessionPlayerAnswer >
}

export class SlideResult extends ValueObject<SlideResultProps> {
    

    private constructor( props: SlideResultProps ){
        super({ ...props });
    }

    public static create (slideId: SlideId,  playerAnswers: SessionPlayerAnswer[] ): SlideResult {

        const answers = new Map();

        playerAnswers.forEach( answer => {
            answers.set( answer.getPlayerId(), answer );
        });

        return new SlideResult({ slideId, answers });

    }

    public searchPlayerAnswer(playerId: PlayerId ): SessionPlayerAnswer {

        if( !this.properties.answers.has( playerId ) )
            throw Error('El jugador solicitado no tiene una respuesta asociada a esta Slide');

        return this.properties.answers.get( playerId )!

    }


    public getSlideId(): SlideId {

        return this.properties.slideId;

    }

}