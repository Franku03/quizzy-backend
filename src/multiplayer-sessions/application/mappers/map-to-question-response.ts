/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\map-to-question-response.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from '../../domain/aggregates/multiplayer-session';

import { OptionSnapshotWithoutAnswers, SlideSnapshotWithoutAnswers } from "../response-dtos/types/slide-without-answers.interface";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";
import { QuestionStartedResponse } from "../response-dtos/question-started.response.dto";

import { COMMON_ERRORS } from "../commands/common.errors";
import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { AppErrorFactory } from "src/core/errors/factories/app-error.factory";
import { createOptionNotFoundError, createSlideNotFoundError } from "../commands/context/errors/create-handler-errors.error";
import { Either, ErrorData } from "src/core/types";

export const mapToQuestionResponse = async ( 
    session: MultiplayerSession, 
    kahoot: Kahoot, 
    mediaService: MediaEnrichmentService
): Promise< Either <ErrorData, QuestionStartedResponse> > => {

    
    const currentSlideId = session.getCurrentSlideInSession(); 

    let currentSlideSnapshot: SlideSnapshot | null = kahoot.getSlideSnapshotById( currentSlideId );
    
    // No debería ocurrir dado que el session se basa en un kahoot existente que de paso nos aseguramos que no esté en DRAFT
    // dejo la protección por si acaso y porque TS la exige
    if( !currentSlideSnapshot )
        return Either.makeLeft( createSlideNotFoundError("getSlideSnapshotById", kahoot.id.value ) );

    if( !currentSlideSnapshot.options )
        return Either.makeLeft( createOptionNotFoundError("SlideSnapshot.options", kahoot.id.value ) );

    currentSlideSnapshot = await mediaService.enrichSlide( currentSlideSnapshot );

    const currentSlideSnapshotClean: SlideSnapshotWithoutAnswers = {
        id: currentSlideSnapshot.id,
        position: currentSlideSnapshot.position,    
        slideType: currentSlideSnapshot.slideType as SlideTypeEnum, 
        timeLimitSeconds: currentSlideSnapshot.timeLimitSeconds, 
        //Opcionales
        questionText: currentSlideSnapshot.questionText ? currentSlideSnapshot.questionText : undefined, 
        slideImageURL: currentSlideSnapshot.slideImageId ? currentSlideSnapshot.slideImageId : undefined, 
        pointsValue: currentSlideSnapshot.pointsValue ? currentSlideSnapshot.pointsValue : undefined, 
        descriptionText: currentSlideSnapshot.descriptionText ? currentSlideSnapshot.descriptionText : undefined, 
        options: undefined, // Se asigna más abajo
    }

    const cleanSnapshotOptions = currentSlideSnapshot.options?.map( ( option, index ) : OptionSnapshotWithoutAnswers => (
        { 
            index: index.toString(),
            text: option.optionText ? option.optionText : undefined,
            mediaURL: option.optionImageId ? option.optionImageId : undefined,
        }
    ))

    currentSlideSnapshotClean.options = cleanSnapshotOptions;

    return Either.makeRight ({
        type: HostNextPhaseType.QUESTION_STARTED,
        data: {
            state: session.getSessionStateType(),
            currentSlideData: currentSlideSnapshotClean
        }
    });

}