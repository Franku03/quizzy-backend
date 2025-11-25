import { Optional } from "src/core/types/optional";
import { TimeLimitSeconds } from "../value-objects/kahoot.slide.time-limit-seconds";
import { Points } from "../value-objects/kahoot.slide.points";
import { ResponseTime } from "../value-objects/response.time";
import { SlideId } from "../value-objects/kahoot.slide.id";
import { Option } from "../value-objects/kahoot.slide.option";

export class Submission {
    
    // Contexto del Slide
    public readonly slideID: SlideId; 
    public readonly questionText: Optional<string>; 
    public readonly questionPoints: Optional<Points>;
    public readonly timeLimit: Optional<TimeLimitSeconds>;
    
    // Datos de la Respuesta
    public readonly answerText: Optional<Option[]>; // Respuestas aceptadas por el usuario
    public readonly answerIndex: number[]; // Índices seleccionados
    public readonly timeElapsed: ResponseTime; // Tiempo de respuesta (VO)

    public constructor(
        slideID: SlideId,
        questionText: Optional<string>,
        questionPoints: Optional<Points>,
        timeLimit: Optional<TimeLimitSeconds>,
        answerText: Optional<Option[]>,
        answerIndex: number[],
        timeElapsed: ResponseTime
    ) {
        if (!slideID || !timeElapsed) {
             throw new Error("La sumisión requiere SlideID y tiempo transcurrido.");
        }
        this.slideID = slideID;
        this.questionText = questionText;
        this.questionPoints = questionPoints;
        this.timeLimit = timeLimit;
        this.answerText = answerText;
        this.answerIndex = answerIndex;
        this.timeElapsed = timeElapsed;
    }
    public getSlideId(): SlideId {
        return this.slideID;
    }

}