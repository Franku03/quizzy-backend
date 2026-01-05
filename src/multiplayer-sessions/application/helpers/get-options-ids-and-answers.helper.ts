import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { COMMON_ERRORS } from "../commands/common.errors";

export const getOptionsIdsAndCorrectAnswers = ( kahoot: Kahoot, previousSlideId: SlideId )  => { 

    
    const currentSlideSnapshot = kahoot.getSlideSnapshotById( previousSlideId );

    if( !currentSlideSnapshot )
        throw new Error(COMMON_ERRORS.SLIDE_NOT_FOUND);

    if( !currentSlideSnapshot.options )
        throw new Error(COMMON_ERRORS.NO_OPTIONS);

    const correctAnswerId: string[] = []
    const optionsId: string[] = []


    currentSlideSnapshot.options?.forEach( ( option, index ) => { 

        if( option.isCorrect )
            correctAnswerId.push( index.toString() );

        optionsId.push( index.toString() )

    });

    if( correctAnswerId.length === 0)
        throw new Error(COMMON_ERRORS.NO_VALID_OPTION);

    return {
        correctAnswerId,
        optionsId
    }


}