import { OptionResponseDTO } from "./kahoot.slide.option.response.dto";

export class SlideResponseDTO {
    id: string;
    text: string | null;
    mediaId: string | null;  
    type: string;
    timeLimit: number;
    points: number | null;
    position: number;
    answers: OptionResponseDTO[] | null;
}