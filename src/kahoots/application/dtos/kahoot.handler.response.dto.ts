import { SlideHandlerResponseDto } from "./kahoot.slide.handler.response.dto";

export class KahootHandlerResponseDto {
    id: string;
    title: string | null;
    description: string | null;
    coverImageId: string | null;
    visibility: string;
    themeId?: string | null;
    theme?: {
        id: string;
        url: string;
        name: string;
    } | null;
    authorId: string;
    createdAt: string;
    playCount: number;
    category: string | null;
    status: string;
    questions: SlideHandlerResponseDto[] | null;
}