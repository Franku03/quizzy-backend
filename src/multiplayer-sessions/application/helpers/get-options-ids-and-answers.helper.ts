/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\get-options-ids-and-answers.helper.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Either, ErrorData } from "src/core/types";
import { createNoValidOptionFound, createOptionNotFoundError, createSlideNotFoundError } from "../commands/context/errors/create-handler-errors.error";

export const getOptionsIdsAndCorrectAnswers = ( 
    kahoot: Kahoot, 
    slideId: SlideId 
): Either<ErrorData,{ correctAnswerId: string[], optionsId: string [] }>  => { 

    
    const currentSlideSnapshot = kahoot.getSlideSnapshotById( slideId );

    if( !currentSlideSnapshot )
        return Either.makeLeft( createSlideNotFoundError( "getSlideSnapshotById", kahoot.id.value ) )

    if( !currentSlideSnapshot.options )
        return Either.makeLeft( createOptionNotFoundError( "getSlideSnapshotById", kahoot.id.value ) )

    const correctAnswerId: string[] = []
    const optionsId: string[] = []


    currentSlideSnapshot.options?.forEach( ( option, index ) => { 

        if( option.isCorrect )
            correctAnswerId.push( index.toString() );

        optionsId.push( index.toString() )

    });

    if( correctAnswerId.length === 0)
        return Either.makeLeft( createNoValidOptionFound( "getOptionsIdsAndCorrectAnswers ", kahoot.id.value ) )


    return Either.makeRight({
        correctAnswerId,
        optionsId
    })


}