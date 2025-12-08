import { OptionHandlerResponse } from "./kahoot.slide.option.handler.response";

export class SlideHandlerResponse {
    id: string;
    text: string | null;
    mediaId: string | null;  
    type: string;
    timeLimit: number;
    points: number | null;
    position: number;
    answers: OptionHandlerResponse[] | null;
}