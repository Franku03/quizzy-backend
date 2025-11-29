import { ValueObject } from "src/core/domain/abstractions/value.object";
import { QuestionSnapshotFactory } from "src/core/domain/factories/question-snapshot.factory";

import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { QuestionSnapshot } from "src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from '../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission';
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";

import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";

import { PlayerId } from './player.id';

interface SessionPlayerAnswerProps {
    playerId: PlayerId,
    slideId: SlideId,
    answerIndex: number[],
    isAnswerCorrect: boolean,
    earnedScore: Score,
    timeElapsed: ResponseTime,
    answerContent: Option[],
    questionSnapshot: QuestionSnapshot   
}

export class SessionPlayerAnswer extends ValueObject<SessionPlayerAnswerProps> {
    

    private constructor( answerProps: SessionPlayerAnswerProps ){

        super({ ...answerProps });

    }

    public static create ( result: Result, playerId: PlayerId ): SessionPlayerAnswer {

        const playerSubmission: Submission = result.getSubmission();

        const answerProps: SessionPlayerAnswerProps = {
            playerId: playerId,
            slideId: playerSubmission.getSlideId(),
            answerIndex: playerSubmission.getAnswerIndex().hasValue() ? playerSubmission.getAnswerIndex().getValue() : [],
            isAnswerCorrect: result.isCorrect(),
            earnedScore: result.getScore().hasValue() ? result.getScore().getValue() : Score.create( 0 ),
            timeElapsed: playerSubmission.getTimeElapsed(),
            answerContent: playerSubmission.getAnswerText().hasValue() ? playerSubmission.getAnswerText().getValue() : [] ,
            questionSnapshot: QuestionSnapshotFactory.createQuestionSnapshotFromResult( result ),
        }

        return new SessionPlayerAnswer( answerProps );
    }

    public didPlayerSelectAnswer(): boolean {
        // Si no hay nada en el arreglo quiere decir que el usuario no seleccionó niguna respuesta
        return this.properties.answerIndex.length === 0;
    }

    public isCorrect(): boolean {
        return this.properties.isAnswerCorrect;
    }

    public getPlayerId(): PlayerId {

        return this.properties.playerId;

    }

    public getSlideId(): SlideId {

        return this.properties.slideId;

    }

    
    public getAnswerIndex(): number[] {

        return this.properties.answerIndex;

    }


    
    public getEarnedScore(): Score {

        return this.properties.earnedScore;

    }

    
    public getTimeElapsed(): ResponseTime {

        return this.properties.timeElapsed;

    }

    public getAnswerContent(): ( string | ImageId )[] {

        if( this.properties.answerContent.length === 0 )
            return [];

        const answerContent = this.properties.answerContent.map( option => {
            
            if( option.getImage().hasValue() )
                return option.getImage().getValue();

            return option.getText();

        });

        return answerContent;
    }

    public getQuestionSnapshot


    // TODO: Colocar demas getters que hagan falta

}
