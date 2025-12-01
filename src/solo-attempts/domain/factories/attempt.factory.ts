// import { SoloAttempt } from "./solo.attempt";
// import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
// import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
// import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";


// export class SoloAttemptFactory {

//     /**
//     Creates a new instance of a SoloAttempt.
//      * * This factory encapsulates necessary creation logic. (Like generating a new UUID)
//      * for the new attempt and initializing the Aggregate in its starting state.
//      * * @param playerId The ID of the user playing the game.
//      * @param kahootId The ID of the Kahoot being played.
//      * @param totalQuestions The total number of questions in the Kahoot. 
//      * Required to initialize the AttemptProgress Value Object correctly.
//      * @returns A new, valid SoloAttempt aggregate root.
//      */
//     public static createNewAttempt(
//         playerId: UserId, 
//         kahootId: KahootId, 
//         totalQuestions: number
//     ): SoloAttempt {
        
//         // Generate a new UUID for the attempt identity.
//         const uuidValue = crypto.randomUUID();
//         const attemptId = new AttemptId(uuidValue);

//         // Delegate the actual instantiation to the Aggregate's static factory method
//         // to ensure all internal invariants are satisfied.
//         return SoloAttempt.create(
//             attemptId,
//             kahootId,
//             playerId,
//             totalQuestions
//         );
//     }
// }