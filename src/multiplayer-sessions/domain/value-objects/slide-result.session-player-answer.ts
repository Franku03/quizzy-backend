import { ValueObject } from "src/core/domain/abstractions/value.object";
import { QuestionSnapshotFactory } from "src/core/domain/factories/question-snapshot.factory";

import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { QuestionSnapshot } from "src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from '../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission';
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { AnswerSelected } from "src/core/domain/shared-value-objects/value-objects/value.object.answer-selected";

import { PlayerId } from './player.id';

interface SessionPlayerAnswerProps {
    playerId: PlayerId,
    slideId: SlideId,
    answerIndex: number[],
    isAnswerCorrect: boolean,
    earnedScore: Score,
    timeElapsed: ResponseTime,
    answerContent: AnswerSelected[],
    questionSnapshot: QuestionSnapshot   
}

export class SessionPlayerAnswer extends ValueObject<SessionPlayerAnswerProps> {
    

    private constructor( answerProps: SessionPlayerAnswerProps ){

        super({ ...answerProps });

    }

    public static create ( result: Result, playerId: PlayerId ): SessionPlayerAnswer {

        const playerSubmission: Submission = result.getSubmission();

        // Mapeamos las option de la submission a AnswerSelected
        const answerContent = AnswerSelected.createFromOptions( playerSubmission );

        const questionSnapshot = QuestionSnapshotFactory.createQuestionSnapshotFromResult( result )

        const answerProps: SessionPlayerAnswerProps = {
            playerId: playerId,

            slideId: playerSubmission.getSlideId(),

            answerIndex: playerSubmission.getAnswerIndex().hasValue() ? playerSubmission.getAnswerIndex().getValue() : [],

            isAnswerCorrect: result.isCorrect(),

            earnedScore: result.getScore().hasValue() ? result.getScore().getValue() : Score.create( 0 ),

            timeElapsed: playerSubmission.getTimeElapsed(),

            answerContent: answerContent, // No pregunto por el valor dado que siempre como minimo hay un arreglo vacio

            questionSnapshot: questionSnapshot,
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


    
    public getEarnedScore(): number {

        return this.properties.earnedScore.getScore();

    }

    
    public getTimeElapsed(): ResponseTime {

        return this.properties.timeElapsed;

    }

    // Si bien esto permite devolver null, en la teoria jamas podria devolver eso, se toma esto asi para complacer al compilador de TS
    public getAnswerContent(): ( string | ImageId )[] {

        const answerContent = this.properties.answerContent.map( option => option.getAnswerContent() );

        return answerContent;

    }

    public getQuestionSnapshot(): QuestionSnapshot {

        return this.properties.questionSnapshot;
        
    }


    // TODO: Colocar demas getters que hagan falta

}
