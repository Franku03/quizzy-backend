import { Optional } from "src/core/types/optional";

interface Score {
    readonly value: number;
}

export class Result {
    
    private readonly score: Optional<Score>;   
    private readonly isAnswerCorrect: boolean;

    public constructor(score: Optional<Score>, isAnswerCorrect: boolean) {
        this.score = score;
        this.isAnswerCorrect = isAnswerCorrect;
    }

    public getScore(): Optional<Score> {
        return this.score;
    }

    public isCorrect(): boolean {
        return this.isAnswerCorrect;
    }
}