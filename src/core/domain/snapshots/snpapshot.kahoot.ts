import { KahootStylingSnapshot } from "./snapshot.kahoot.-stiyling";
import { KahootDetailsSnapshot } from "./snapshot.kahoot.details";
import { SlideSnapshot } from "./snapshot.slide";

export interface KahootSnapshot {
    id: string; 
    authorId: string;
    createdAt: string; 
    details?: KahootDetailsSnapshot; 
    visibility: string; 
    status: string; 
    playCount: number;
    styling: KahootStylingSnapshot; 
    slides?: SlideSnapshot[]; 
}