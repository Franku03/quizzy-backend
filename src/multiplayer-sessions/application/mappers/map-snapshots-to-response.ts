import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from '../../domain/aggregates/multiplayer-session';

import { OptionSnapshotWithoutAnswers, SlideSnapshotWithoutAnswers } from "../response-dtos/slide-without-answers.interface";
import { SlideSnapshot } from "src/database/infrastructure/mongo/entities/kahoots.schema";

import { COMMON_ERRORS } from "../commands/common.errors";

export const mapSnapshotsToQuestionResponse = ( session: MultiplayerSession, kahoot: Kahoot ): SlideSnapshotWithoutAnswers => {
    
    const currentSlideId = session.getCurrentSlideInSession(); 

    const currentSlideSnapshot: SlideSnapshot | SlideSnapshotWithoutAnswers | null = kahoot.getSlideSnapshotById( currentSlideId );
    
    // No debería ocurrir dado que el session se basa en un kahoot existente que de paso nos aseguramos que no esté en DRAFT
    // dejo la protección por si acaso y porque TS la exige
    if( !currentSlideSnapshot )
        throw new Error(COMMON_ERRORS.SLIDE_NOT_FOUND)

    if( !currentSlideSnapshot.options )
        throw new Error(COMMON_ERRORS.NO_OPTIONS)
    

    const cleanSnapshotOptions = currentSlideSnapshot.options?.map( ( option ) : OptionSnapshotWithoutAnswers => (
        { 
            optionText: option.optionText,
            optionImageId: option.optionImageId,
        }
    ))

    // TODO: Incoporar los assetEnricher de las slides y sus option una vez existan

    currentSlideSnapshot.options = cleanSnapshotOptions;

    return currentSlideSnapshot;

}