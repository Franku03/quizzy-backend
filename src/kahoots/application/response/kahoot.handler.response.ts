import { SlideHandlerResponse} from "./kahoot.slide.handler.response";

export class KahootHandlerResponse {
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
    questions: SlideHandlerResponse[] | null;
}