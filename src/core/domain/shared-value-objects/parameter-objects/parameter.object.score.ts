// NOTA: Asumimos que la clase 'ValueObject<T>' está disponible.

import { ValueObject } from "../../abstractions/value.object";

interface ScoreProps {
    readonly totalScore: number;
}

export class Score extends ValueObject<ScoreProps> {
    
    protected constructor(props: ScoreProps) {
        if (props.totalScore < 0) {
            throw new Error("El puntaje total no puede ser negativo.");
        }
        if (!Number.isInteger(props.totalScore)) {
             throw new Error("El puntaje total debe ser un número entero.");
        }
        
        super(props);
    }

    public static create(score: number): Score {
        return new Score({ totalScore: score });
    }

    public addScore(scoreToAdd: Score): Score {
        const newTotal = this.properties.totalScore + scoreToAdd.getScore();
        return new Score({ totalScore: newTotal });
    }
    
    public getScore(): number {
        return this.properties.totalScore;
    }
    // El método equals() se hereda a de ValueObject<T>.
}