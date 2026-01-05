import { OptionHandlerResponseDto } from "./kahoot.slide.option.handler.response.dto";

export class SlideHandlerResponseDto {
    id: string;
    text: string | null;
    mediaId: string | null;  
    type: string;
    timeLimit: number;
    points: number | null;
    position: number;
    answers: OptionHandlerResponseDto[] | null;
}