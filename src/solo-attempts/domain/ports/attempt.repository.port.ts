import { SoloAttempt } from "../aggregates/attempt";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId} from "src/core/domain/shared-value-objects/id-objects/kahoot.id";

export interface SoloAttemptRepository {
  // We use Promises for async DB access
  // Return nullable to handle 404s gracefully

  // Basic lookups by ID. Used in most business logic to load the aggregate for operations
  findById(attemptId: AttemptId): Promise<SoloAttempt | null>;
  
  // Specific lookup to support "Resume vs Start New" logic efficiently.
  // If a user tries to start a new attempt, we first check if there's an existing 
  // in-progress attempt for that user/kahoot combo. Only one active attempt per user/kahoot is allowed.
  // So, if found, the existing attempt will be deleted before starting a new one (by the app layer)
  findActiveForUserIdAndKahootId(userId: UserId, kahootId: KahootId): Promise<SoloAttempt | null>;

  // List all active (in-progress) attempts for a user. 
  findAllActiveForUserId(userId: UserId): Promise<SoloAttempt[]>;

  // List all active (in-progress) attempts for a kahoot.
  findAllActiveForKahootId(kahootId: KahootId): Promise<SoloAttempt[]>;

  // Persistence
  // Saves or updates the aggregate in the DB
  save(attempt: SoloAttempt): Promise<void>;
  
  // Deletes the aggregate from the DB 
  // Used when a user starts a new attempt instead of resuming an existing one. 
  // Only in-progress and completed attempts are kept for record-keeping.
  // So, if a user abandons an attempt and starts over, we delete the old one.
  // Also used for cleanup of active attempts when a kahoot is modified.
  delete(attemptId: AttemptId): Promise<void>; 

  // Deletes all active (in-progress) attempts for a kahoot.
  // Used when a kahoot is modified to ensure no one continues an attempt on an outdated version.
  deleteAllActiveForKahootId(kahootId: KahootId): Promise<number>;
}