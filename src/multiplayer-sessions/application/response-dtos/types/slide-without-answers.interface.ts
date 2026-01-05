import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";

export interface OptionSnapshotWithoutAnswers {
    index: string;
    text?: string;
    mediaId?: string; // ID del asset asociado, es necesario pasarlo al front para que se pueda construir la submission y registrar la respuesta, la fabrica de options solo acepta Ids. no urls
    mediaURL?: string; 
}


// export interface OptionSnapshotWithoutAnswers {
//     optionText?: string;
//     optionImageId?: string; 
// }

export interface SlideSnapshotWithoutAnswers {
    id: string;
    questionIndex: number;
    slideType: SlideTypeEnum; 
    timeLimitSeconds: number; 
    //Opcionales
    questionText?: string; 
    slideImageURL?: string; 
    pointsValue?: number; 
    descriptionText?: string; 
    options?: OptionSnapshotWithoutAnswers[]; 
}