// src/solo-attempts/application/queries/ports/solo-attempt-query.dao.port.ts

import { Optional } from 'src/core/types/optional';
import { AttemptResumeReadModel } from '../read-models/resume.attempt.read.model';
import { AttemptSummaryReadModel } from '../read-models/summary.attempt.read.model';
import { AttemptReportReadModel } from '../../../../reports/application/queries/read-models/solo.attempt.report.read.model';
import { AttemptInspectReadModel } from '../read-models/inspect.attempt.read.model';

export interface ISoloAttemptQueryDao {
  // ---------------------------------------------------------------------------
  // GAMEPLAY CONTEXT
  // ---------------------------------------------------------------------------

  // Retrieves the current state of an attempt to allow the user to resume play.
  // This method must perform an aggregation/lookup to fetch the specific Slide
  // data from the Kahoot collection based on the current 'questionsAnswered'
  // index in the Attempt's progress.
  getResumeContext(attemptId: string): Promise<Optional<AttemptResumeReadModel>>;

  // Checks the status of a user's engagement with a specific Kahoot.
  // It prioritizes finding an active attempt (IN_PROGRESS). If none exists,
  // it falls back to the first completed attempt found.
  // if none is found, returns a read model with no game state. 
  // Returns a model indicating the status (in-progress/completed/none) and game state.
  inspectAttempt(kahootId: string, userId: string): Promise<Optional<AttemptInspectReadModel>>;

  // ---------------------------------------------------------------------------
  // REPORTING CONTEXT
  // ---------------------------------------------------------------------------

  // Calculates the quick stats shown immediately after finishing a game.
  // This relies primarily on the 'progress' and 'totalScore' fields of the
  // Attempt entity.
  getPerformanceSummary(attemptId: string): Promise<Optional<AttemptSummaryReadModel>>;

  // Reconstructs the full timeline of the game for a detailed report.
  // This requires unwinding the 'answers' array in the Attempt entity and
  // mapping the snapshots of questions and answers stored.
  // It also requires a join with Kahoot to fetch the game Title.
  getDetailedReport(attemptId: string): Promise<Optional<AttemptReportReadModel>>;
  

  // ---------------------------------------------------------------------------
  // AUTHORIZATION CONTEXT
  // ---------------------------------------------------------------------------

  // FAST lookup of user ID associated with a given attempt. 
  // Used for authorization checks.
  // O(1) speed.
  getAttemptUserId(attemptId: string): Promise<Optional<string>>;

}