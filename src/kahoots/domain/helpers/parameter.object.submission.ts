// NOTA: Asumimos que SlideId, Points, TimeLimitSeconds, ResponseTime y Optional<T> son accesibles.

import { Optional } from "src/core/types/optional";
import { TimeLimitSeconds } from "../value-objects/kahoot.slide.time-limit-seconds";
import { Points } from "../value-objects/kahoot.slide.points";
import { ResponseTime } from "../value-objects/response.time";
import { SlideId } from "../value-objects/kahoot.slide.id";

export class Submission {
    
    public readonly slideId: SlideId; 
    public readonly questionPoints: Optional<Points>;
    public readonly timeLimit: Optional<TimeLimitSeconds>;
    public readonly answerIndex: number[]; 
    public readonly timeElapsed: ResponseTime;

    public constructor(
        slideId: SlideId,
        questionPoints: Optional<Points>,
        timeLimit: Optional<TimeLimitSeconds>,
        answerIndex: number[],
        timeElapsed: ResponseTime
    ) {
        if (!slideId || !timeElapsed) {
             throw new Error("La submission requiere ID de slide y tiempo transcurrido.");
        }
        this.slideId = slideId;
        this.questionPoints = questionPoints;
        this.timeLimit = timeLimit;
        this.answerIndex = answerIndex;
        this.timeElapsed = timeElapsed;
    }
}