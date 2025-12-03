import { SlideResponseDTO } from "./kahoot.slide.response.dto";

export class KahootResponseDTO {
    id: string;
    title: string | null;
    description: string | null;
    coverImageId: string | null;
    visibility: string;
    themeId: string;
    authorId: string;
    createdAt: string; 
    playCount: number;
    category: string | null;
    status: string;
    questions: SlideResponseDTO[] | null;
}