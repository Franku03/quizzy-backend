/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\value-objects\slide-result.session-player-answer.ts

import { ValueObject } from "src/core/domain/abstractions/value.object";

import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
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
}

export class SessionPlayerAnswer extends ValueObject<SessionPlayerAnswerProps> {
    

    public constructor( answerProps: SessionPlayerAnswerProps ){

        super({ ...answerProps });

    }

    public static create ( result: Result, playerId: PlayerId ): SessionPlayerAnswer {

        const playerSubmission: Submission = result.getSubmission();

        // Mapeamos las option de la submission a AnswerSelected
        const answerContent = AnswerSelected.createFromOptions( playerSubmission );


        const answerProps: SessionPlayerAnswerProps = {
            playerId: playerId,

            slideId: playerSubmission.getSlideId(),

            answerIndex: playerSubmission.getAnswerIndex().hasValue() ? playerSubmission.getAnswerIndex().getValue() : [],

            isAnswerCorrect: result.isCorrect(),

            earnedScore: result.getScore().hasValue() ? result.getScore().getValue() : Score.create( 0 ),

            timeElapsed: playerSubmission.getTimeElapsed(),

            answerContent: answerContent,

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

    public getProperties(): SessionPlayerAnswerProps {
        return this.properties;
    }
}
