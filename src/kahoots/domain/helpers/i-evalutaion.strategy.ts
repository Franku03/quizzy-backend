import { Result } from "./parameter.object.result";
import { Submission } from "./parameter.object.submission";
import { Option } from "../value-objects/kahoot.slide.option";

export interface EvaluationStrategy {
    evaluateAnswer(submission: Submission, options: Option[]): Result;
}