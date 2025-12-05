import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";

export interface OptionSnapshotWithoutAnswers {
    optionText?: string;
    optionImageId?: string; 
}


export interface SlideSnapshotWithoutAnswers {
    id: string; 
    position: number;
    slideType: SlideTypeEnum; 
    timeLimitSeconds: number; 
    //Opcionales
    questionText?: string; 
    slideImageId?: string; 
    pointsValue?: number; 
    descriptionText?: string; 
    options?: OptionSnapshotWithoutAnswers[]; 
}