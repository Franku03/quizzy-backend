import { DateISO } from "../shared-value-objects/value-objects/value.object.date";
import { KahootStylingSnapshot } from "./snapshot.kahoot.-stiyling";
import { KahootDetailsSnapshot } from "./snapshot.kahoot.details";
import { SlideSnapshot } from "./snapshot.slide";

export interface KahootSnapshot {
    id: string; 
    authorId: string;
    createdAt: DateISO; 
    details: KahootDetailsSnapshot | null; 
    visibility: string; 
    status: string; 
    playCount: number;
    styling: KahootStylingSnapshot; 
    slides: SlideSnapshot[] | null; 
}