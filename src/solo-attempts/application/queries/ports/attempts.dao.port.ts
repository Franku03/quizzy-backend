// src/solo-attempts/application/queries/ports/solo-attempt-query.dao.port.ts

import { Optional } from 'src/core/types/optional';
import { AttemptResumeReadModel } from '../read-models/resume.attempt.read.model';
import { AttemptSummaryReadModel } from '../read-models/summary.attempt.read.model';
import { AttemptReportReadModel } from '../read-models/report.attempt.read.model';

export interface ISoloAttemptQueryDao {
  // ---------------------------------------------------------------------------
  // GAMEPLAY CONTEXT
  // ---------------------------------------------------------------------------

  // Retrieves the current state of an attempt to allow the user to resume play.
  // This method must perform an aggregation/lookup to fetch the specific Slide
  // data from the Kahoot collection based on the current 'questionsAnswered'
  // index in the Attempt's progress.
  getResumeContext(attemptId: string): Promise<Optional<AttemptResumeReadModel>>;

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

}