import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";

import { OptionSnapshotWithoutAnswers, SlideSnapshotWithoutAnswers } from "../response-dtos/slide-without-answers.interface";
import { SlideSnapshot } from "src/database/infrastructure/mongo/entities/kahoots.schema";

import { COMMON_ERRORS } from "../commands/common.errors";

export const mapSnapshotsToQuestionResponse = ( kahoot: Kahoot, index: number ): SlideSnapshotWithoutAnswers => {
    

    const currentSlideSnapshot: SlideSnapshot | SlideSnapshotWithoutAnswers | null = kahoot.getNextSlideSnapshotByIndex( index );
    
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

    currentSlideSnapshot.options = cleanSnapshotOptions;

    return currentSlideSnapshot;

}