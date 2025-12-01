import { Result } from '../shared-value-objects/parameter-objects/parameter.object.result';
import { QuestionSnapshot } from '../shared-value-objects/value-objects/value.object.question-snapshot';
import { Points } from '../shared-value-objects/value-objects/value.object.points';
import { TimeLimitSeconds } from '../shared-value-objects/value-objects/value.object.time-limit-seconds';

export class QuestionSnapshotFactory {

    // Factory method to create a QuestionSnapshot from a Result object
    // This ensures that the snapshot accurately reflects the question state
    public static createQuestionSnapshotFromResult (result: Result): QuestionSnapshot {
        let base_points: Points;
        const submission = result.getSubmission()

        // We validate that the submission has the necessary question details for snapshotting
        // This check is needed because submisson has Optional fields for question data
        // As this data is initially empty when sent from the client And then filled when evaluating 
        // with the kahoot aggregate. Here we ensure they were properly filled.
        if (!submission.getQuestionText().hasValue() || 
            !submission.getTimeLimit().hasValue()) {
            throw new Error("Cannot create player answer. The player's submission data is missing question details (text and time limit).");
        }

        // If question points were not provided, we default to zero points
        if ( !submission.getQuestionPoints().hasValue() ) {
            base_points = new Points(0); 
        }
        else{
            base_points = submission.getQuestionPoints().getValue();
        }

        // We create the Snapshot of the question state at the moment of answering
        // We extract this from the submission data to ensure historical accuracy
        // even if the Kahoot is edited later.
        const questionSnapshot = QuestionSnapshot.create(
            submission.getQuestionText().getValue(),
            base_points,
            submission.getTimeLimit().getValue()
        );

        return questionSnapshot;
    }
}