import { Optional } from "src/core/types/optional";
import { Submission } from './parameter.object.submission';
import { ValueObject } from "../../abstractions/value.object";
import { Score } from "../value-objects/value.object.score";

interface ResultProps {
    readonly submission: Submission; 
    readonly score: Optional<Score>; 
    readonly isAnswerCorrect: boolean;
}

export class Result extends ValueObject<ResultProps> {
    
    public constructor(submission: Submission, score: Optional<Score>, isAnswerCorrect: boolean) {
        if (!submission) {
            throw new Error("El resultado debe estar asociado a una submission válida.");
        }
        
        super({ submission, score, isAnswerCorrect });
    }

    public getScore(): Optional<Score> {
        return this.properties.score;
    }
    
    public isCorrect(): boolean {
        return this.properties.isAnswerCorrect;
    }
    
    public getSubmission(): Submission {
        return this.properties.submission; 
    }
}