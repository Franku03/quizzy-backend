import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Option } from "../value-objects/kahoot.slide.option";

export interface EvaluationStrategy {
    evaluateAnswer(submission: Submission, options: Option[]): Result;
}