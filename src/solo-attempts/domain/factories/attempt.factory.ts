import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { AttemptProgress } from "../value-objects/attempt.progress";
import { AttemptTimeDetails } from "../value-objects/attempt.time-details";
import { AttemptStatus } from "../value-objects/attempt.status";
import { SoloAttempt} from "../aggregates/attempt";

// The SoloAttemptFactory is responsible for the complex lifecycle initialization 
// of a new Single Player game session. 
// It ensures that all Value Objects are created with their correct initial states
// (Score at 0, Progress at 0, TimeDetails started now) so the Aggregate 
// starts its life in a valid, consistent state.
// However, it is not responsible for validating the invariants of those Value Objects,
// as that is handled within their own constructors/factory methods and the Aggregate itself.
export class SoloAttemptFactory {

    // We create a brand new Solo Attempt for a player.
    // NOTE: We require 'totalQuestions' here because the AttemptProgress Value Object
    // demands it upon creation to maintain its invariants (answered <= total).
    // The calling service should retrieve this count from the Kahoot Aggregate.
    public static createNewAttempt(
        attemptId: AttemptId,
        playerId: UserId, 
        kahootId: KahootId, 
        totalQuestions: number
    ): SoloAttempt {
        // A new game always starts with a score of zero.
        const initialScore = Score.create(0);

        // We initialize progress with 0 answered questions and the mandated total.
        const initialProgress = AttemptProgress.create(totalQuestions, 0);

        // We capture the exact moment the game starts for audit purposes.
        const initialTimeDetails = AttemptTimeDetails.create(new Date());

        // We assemble the aggregate using the props interface.
        return new SoloAttempt({
            id: attemptId,
            kahootId: kahootId,
            playerId: playerId,
            status: AttemptStatus.createInProgress(),
            totalScore: initialScore,
            progress: initialProgress,
            timeDetails: initialTimeDetails,
            answers: [] // No answers have been submitted yet
        });
    }
}