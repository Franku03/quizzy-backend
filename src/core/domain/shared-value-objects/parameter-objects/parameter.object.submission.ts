import { Optional } from "src/core/types/optional";
import { TimeLimitSeconds } from "../../../../kahoots/domain/value-objects/kahoot.slide.time-limit-seconds";
import { Points } from "../../../../kahoots/domain/value-objects/kahoot.slide.points";
import { SlideId } from "../id-objects/kahoot.slide.id";
import { Option } from "../../../../kahoots/domain/value-objects/kahoot.slide.option";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ResponseTime } from "./parameter.object.response-time";

interface SubmissionProps {
    readonly slideID: SlideId; 
    readonly questionText: Optional<string>; 
    readonly questionPoints: Optional<Points>;
    readonly timeLimit: Optional<TimeLimitSeconds>;
    readonly answerText: Optional<Option[]>;
    readonly answerIndex: number[];
    readonly timeElapsed: ResponseTime;
}

export class Submission extends ValueObject<SubmissionProps> {
    
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
        
        const props: SubmissionProps = {
            slideID,
            questionText,
            questionPoints,
            timeLimit,
            answerText,
            answerIndex,
            timeElapsed
        };

        super(props);
    }
    
    public getSlideId(): SlideId {
        return this.properties.slideID;
    }
    
    public getQuestionText(): Optional<string> {
        return this.properties.questionText;
    }
    
    public getQuestionPoints(): Optional<Points> {
        return this.properties.questionPoints;
    }

    public getTimeLimit(): Optional<TimeLimitSeconds> {
        return this.properties.timeLimit;
    }

    public getAnswerText(): Optional<Option[]> {
        return this.properties.answerText;
    }

    public getAnswerIndex(): number[] {
        return this.properties.answerIndex;
    }
    
    public getTimeElapsed(): ResponseTime {
        return this.properties.timeElapsed;
    }
    
}