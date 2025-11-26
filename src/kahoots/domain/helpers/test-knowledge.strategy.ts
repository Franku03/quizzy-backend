import { Optional } from "src/core/types/optional";
import { EvaluationStrategy } from "./i-evalutaion.strategy";
import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Option } from "../value-objects/kahoot.slide.option";
import { Score } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.score";

export class TestKnowledgeEvaluationStrategy implements EvaluationStrategy {

    public evaluateAnswer(submission: Submission, options: Option[]): Result {
        
        // 1. Determinar si la Respuesta es Correcta (Debe ser el primer paso)
        const isCorrect = this.determineCorrectness(submission.getAnswerIndex(), options);
        
        // Si la respuesta no es correcta, la puntuación es 0, y no se ejecuta la fórmula compleja.
        if (!isCorrect) {
            // Devuelve 0 puntos (Score VO) y el estado incorrecto.
            return new Result(submission,new Optional<Score>(Score.create(0)), false); 
        }

        // 2. Desempaquetar VOs para el Cálculo (Si la respuesta es correcta)
        
        // El AR debe garantizar que estos VOs están presentes para el cálculo.
        const responseTime = submission.getTimeElapsed().toSeconds();
        const questionTimer = submission.getTimeLimit().getValue().value; // Límite en segundos
        const pointsPossible = submission.getQuestionPoints().getValue().value; // Puntos base
        
        // 3. Aplicación de la Fórmula de Puntuación
        
        // Evitar la división por cero (aunque debería prevenirse por invariantes).
        if (questionTimer <= 0) {
            const finalScore = pointsPossible > 0 ? pointsPossible : 0;
            return new Result(submission, new Optional(Score.create(finalScore)), isCorrect); 
        }
        
        //https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work
        // FÓRMULA: Score = Round( ( 1 - (RT / QT) / 2 ) * PP )
        
        const responseRatio = responseTime / questionTimer;
        const scoreFactor = 1 - (responseRatio / 2);
        
        // Aseguramos que el factor no sea negativo (la puntuación mínima es 0).
        const finalScoreFactor = Math.max(0, scoreFactor);
        
        const finalScore = Math.round(finalScoreFactor * pointsPossible);

        // 4. Devolver el Resultado
        return new Result(submission,new Optional(Score.create(finalScore)), isCorrect);
    }
    

    //Compara los índices seleccionados por el usuario con las opciones correctas del quiz.

        private determineCorrectness(userAnswersIndices: number[], quizOptions: Option[]): boolean {
        
        // 1. Identificar el conjunto EXACTO de índices correctos
        const correctIndices = quizOptions
            .map((option, index) => ({ option, index }))
            .filter(item => item.option.isCorrectAnswer())
            .map(item => item.index);
        
        // 2. Si no hay respuestas correctas definidas, la sumbmission es incorrecta (no debe llegar a este punto).
        if (correctIndices.length === 0) {
            return false;
        }
        
        // =========================================================================
        //LÓGICA DE COINCIDENCIA PERFECTA (Aplica a Single/Multiple/Type/TrueFalse)
        // =========================================================================
        
        //Esto debe ser testeado con la mayor rigurosidad del mundo gente es bastante complejo 

        // Si hay respuestas correctas, la sumisión es correcta solo si:
        // a) El usuario seleccionó la misma cantidad de respuestas correctas.
        // b) TODOS los índices seleccionados por el usuario son parte del conjunto de respuestas correctas.

        const userSet = new Set(userAnswersIndices);
        const correctSet = new Set(correctIndices);

        // Condición 1: Tienen el mismo tamaño (el usuario no se saltó ninguna respuesta correcta ni seleccionó extra).
        const sizeMatch = userSet.size === correctSet.size;
        
        // Condición 2: Todos los índices seleccionados por el usuario están incluidos en el set de correctas.
        const contentMatch = [...userSet].every(index => correctSet.has(index));

        // Si el usuario seleccionó el conjunto EXACTO de respuestas requeridas.
        return sizeMatch && contentMatch;
    }
}