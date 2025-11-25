import { EvaluationStrategy } from "./i-evalutaion.strategy";
import { Result } from "./parameter.object.result";
import { Submission } from "./parameter.object.submission";

//Sere honesto luego de tanta sobre ingenieria yo no se que poner aqui realmente creo q estamos obligando a una clase a existir sin un proposito real
//todo por el slideDisplay q es un tipo muy particular de slide

export class NoEvaluationStrategy implements EvaluationStrategy {

    public evaluateAnswer(submission: Submission): Result {
        
        throw new Error("ERROR: Se intentó evaluar un Display Slide. Este tipo de slide no tiene lógica de puntuación.");
    }
}