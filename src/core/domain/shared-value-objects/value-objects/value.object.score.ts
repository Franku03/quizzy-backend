/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\value-objects\value.object.score.ts

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