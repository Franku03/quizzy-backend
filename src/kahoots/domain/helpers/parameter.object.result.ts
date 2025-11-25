import { Optional } from "src/core/types/optional";
import { Submission } from "./parameter.object.submission";

interface Score {
    readonly value: number;
}

export class Result {
    
    // La sumisión completa que generó el resultado
    private readonly submission: Submission; 
    // El puntaje calculado, opcional si el quiz no da puntos.
    private readonly score: Optional<Score>; 

    private readonly isAnswerCorrect: boolean;

    public constructor(submission: Submission, score: Optional<Score>, isAnswerCorrect: boolean) {
        if (!submission) {
            throw new Error("El resultado debe estar asociado a una submission.");
        }
        this.submission = submission;
        this.score = score;
        this.isAnswerCorrect = isAnswerCorrect;
    }
    public getScore(): Optional<Score> {
        return this.score;
    }
    public isCorrect(): boolean {
        return this.isAnswerCorrect;
    }
    public getSubmission(): Submission {
        return this.submission;
    }
}