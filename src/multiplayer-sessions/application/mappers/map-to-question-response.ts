import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from '../../domain/aggregates/multiplayer-session';

import { OptionSnapshotWithoutAnswers, SlideSnapshotWithoutAnswers } from "../response-dtos/types/slide-without-answers.interface";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";
import { QuestionStartedResponse } from "../response-dtos/question-started.response.dto";

import { COMMON_ERRORS } from "../commands/common.errors";
import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";

export const mapToQuestionResponse = async ( session: MultiplayerSession, kahoot: Kahoot, mediaService: MediaEnrichmentService): Promise<QuestionStartedResponse> => {
    
    const currentSlideId = session.getCurrentSlideInSession(); 

    let currentSlideSnapshot: SlideSnapshot | null = kahoot.getSlideSnapshotById( currentSlideId );
    
    // No debería ocurrir dado que el session se basa en un kahoot existente que de paso nos aseguramos que no esté en DRAFT
    // dejo la protección por si acaso y porque TS la exige
    if( !currentSlideSnapshot )
        throw new Error(COMMON_ERRORS.SLIDE_NOT_FOUND)

    if( !currentSlideSnapshot.options )
        throw new Error(COMMON_ERRORS.NO_OPTIONS)

    currentSlideSnapshot = await mediaService.enrichSlide( currentSlideSnapshot );

    const currentSlideSnapshotClean: SlideSnapshotWithoutAnswers = {
        id: currentSlideSnapshot.id,
        questionIndex: currentSlideSnapshot.position,    
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

    return {
        type: HostNextPhaseType.QUESTION_STARTED,
        data: {
            state: session.getSessionStateType(),
            // questionIndex: session.getCurrentSlideIndex(),
            currentSlideData: currentSlideSnapshotClean
        }
    };

}