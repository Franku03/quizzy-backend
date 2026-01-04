import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";

export interface OptionSnapshotWithoutAnswers {
    index: string;
    text?: string;
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