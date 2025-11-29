import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";
import { OptionSnapshot } from "./snapshot.option"; 

export interface SlideSnapshot {
    id: string; 
    position: number;
    slideType: SlideTypeEnum; 
    timeLimitSeconds: number; 
    //Opcionales
    questionText: string | null; 
    slideImageId: string | null; 
    pointsValue: number | null; 
    descriptionText: string | null; 
    options: OptionSnapshot[] | null; 
}