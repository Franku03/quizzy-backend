import { Result } from '../shared-value-objects/parameter-objects/parameter.object.result';
import { QuestionSnapshot } from '../shared-value-objects/value-objects/value.object.question-snapshot';
import { Points } from '../shared-value-objects/value-objects/value.object.points';
import { TimeLimitSeconds } from '../shared-value-objects/value-objects/value.object.time-limit-seconds';

export class QuestionSnapshotFactory {

    public static createQuestionSnapshotFromResult (result: Result): QuestionSnapshot {

        const submission = result.getSubmission()

        const questionSnapshot = QuestionSnapshot.create(

            submission.getQuestionText().hasValue() 
                ? submission.getQuestionText().getValue() : '',

            submission.getQuestionPoints().hasValue() 
                ? submission.getQuestionPoints().getValue() : new Points( 0 ),

            submission.getTimeLimit().hasValue() 
                ? submission.getTimeLimit().getValue() : new TimeLimitSeconds( 0 ),
        );

        return questionSnapshot;
    }
}