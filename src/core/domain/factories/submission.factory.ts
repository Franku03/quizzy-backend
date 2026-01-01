import { Optional } from "src/core/types/optional";

import { SlideId } from "../shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "../shared-value-objects/value-objects/value.object.response-time";
import { Points } from '../shared-value-objects/value-objects/value.object.points';
import { TimeLimitSeconds } from '../shared-value-objects/value-objects/value.object.time-limit-seconds';
import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";
import { SlideSnapshot } from "../snapshots/snapshot.slide";

import { Submission } from "../shared-value-objects/parameter-objects/parameter.object.submission";
import { KahootFactory } from '../../../kahoots/domain/factories/kahoot.factory';

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
    ): Submission {

        const optionSnapshot = slideInfo.options;

        if( !optionSnapshot )
            throw new Error("La Slide no contiene Opciones de Respuesta");

        const optQuestionText = new Optional( slideInfo.questionText );

        if( !slideInfo.pointsValue )
            throw new Error("La Slide no da puntos por respuesta");

        const optPointsValue = new Optional( new Points( slideInfo.pointsValue ) );

        const optTimeLimit = new Optional( new TimeLimitSeconds(slideInfo.timeLimitSeconds) );


        const answerTexts = optionSnapshot.filter( (opt, index) => {

            const strIndex = index.toString();

            if( answerIndex.includes( strIndex ) )
                return opt;

        });

        // * La importacion del Option aqui existe solo para tipear el arreglo, TS exige que lo hagamos asi (de lo contrario es una arreglo de tipo never[])
        const options: Option[] = [];

        for( const answer of answerTexts ){

            // let imageId: Optional<ImageId>;
            const imageIdString = answer.optionImageId;
            let text: string;


            if( !answer.optionText ){

                text = "";

            }else{

                text = answer.optionText;
            }
            
            options.push( KahootFactory.buildOption(
              {
                text:text,
                optionImage: imageIdString,
                isCorrect: answer.isCorrect,
              }
            ));


        }

        const optAnswerTexts = new Optional( options );

        const answerIndexes = answerIndex.map( resIndex => {
            return +resIndex;
        })

        const optAnswerIndexes = new Optional( answerIndexes );

        const timeElapsed = new ResponseTime( timeElapsedMs );

        return new Submission(
            slideId,
            optQuestionText,
            optPointsValue,
            optTimeLimit,
            optAnswerTexts,
            optAnswerIndexes,
            timeElapsed
        );

    }

    
}