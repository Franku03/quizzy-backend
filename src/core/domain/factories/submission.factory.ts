/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\factories\submission.factory.ts

import { Optional } from "src/core/types/optional";

import { SlideId } from "../shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "../shared-value-objects/value-objects/value.object.response-time";
import { Points } from '../shared-value-objects/value-objects/value.object.points';
import { TimeLimitSeconds } from '../shared-value-objects/value-objects/value.object.time-limit-seconds';
import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";
import { SlideSnapshot } from "../snapshots/snapshot.slide";

import { Submission } from "../shared-value-objects/parameter-objects/parameter.object.submission";
import { KahootFactory } from '../../../kahoots/domain/factories/kahoot.factory';
import { Either, ErrorData } from "src/core/types";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class SubmissionFactory {



    /*
        slideInfo: SlideSnapshot, 
        questionText: Optional<string>, 
        questionPoints: Optional<Points>,
        timeLimit: Optional<TimeLimitSeconds>,
        answerText: Optional<Option[]>,
        answerIndex: Optional<number[]>,
        timeElapsed: ResponseTime, 
     
    */
    public static buildDomainSubmission(
        slideId: SlideId,
        slideInfo: SlideSnapshot,
        timeElapsedMs: number,
        answerIndex: string[],
    ): Either<ErrorData, Submission> {

        const optionSnapshot = slideInfo.options;

        if (!optionSnapshot){
            const error = new Error("La Slide no contiene Opciones de Respuesta");
            return Either.makeLeft( this.buildSlideErrorData( error, slideId.value ) ) ;
        }

        if (!slideInfo.pointsValue){
            const error = new Error("La Slide no da puntos por respuesta");
            return Either.makeLeft( this.buildSlideErrorData( error, slideId.value ) ) ;
        }


        const optQuestionText = new Optional(slideInfo.questionText);

        const optPointsValue = new Optional(new Points(slideInfo.pointsValue));

        const optTimeLimit = new Optional(new TimeLimitSeconds(slideInfo.timeLimitSeconds));


        const answerTexts = optionSnapshot.filter((opt, index) => {

            const strIndex = index.toString();

            if (answerIndex.includes(strIndex))
                return opt;

        });

        // * La importacion del Option aqui existe solo para tipear el arreglo, TS exige que lo hagamos asi (de lo contrario es una arreglo de tipo never[])
        const options: Option[] = [];

        for (const answer of answerTexts) {
            const text = answer.optionText || "";

            const optionResult = KahootFactory.buildOption({
                text: text,
                optionImage: answer.optionImageId,
                isCorrect: answer.isCorrect,
            });

            if (optionResult.isLeft()) {
                //return Either.makeLeft(optionResult.getLeft());
            }
            options.push(optionResult.getRight());
        }

        const optAnswerTexts = new Optional(options);

        const answerIndexes = answerIndex.map(resIndex => {
            return +resIndex;
        })

        const optAnswerIndexes = new Optional(answerIndexes);

        const timeElapsed = ResponseTime.fromMilliseconds(timeElapsedMs);

        const submission = new Submission(
            slideId,
            optQuestionText,
            optPointsValue,
            optTimeLimit,
            optAnswerTexts,
            optAnswerIndexes,
            timeElapsed
        );

        return Either.makeRight( submission );

    }

    private static buildSlideErrorData( error: Error, slideId: string ): ErrorData {

        return DomainErrorFactory.validation(
            createDomainContext('SubmissionFactory', 'Factory', { actorId: slideId, domainObjectKind: 'Entity', rootAggregateName: 'Kahoot'} ),
            { optionSnapshot: ['NO_OPTIONS'] },
            error.message
        );

    }


}