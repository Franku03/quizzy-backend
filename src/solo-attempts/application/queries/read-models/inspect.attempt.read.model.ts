// src/solo-attempts/application/queries/read-models/inspect.attempt.read.model.ts

// Used for inspecting the current state of a solo attempt,
// including whether it's in progress or completed, along with game state details.
// Called by kahoot inspect handler

export class AttemptGameStateReadModel {
  constructor(
    public readonly attemptId: string,
    public readonly currentScore: number,
    public readonly currentSlide: number,
    public readonly totalSlides: number,
    public readonly lastPlayedAt: Date,
  ) {}
}

export class AttemptInspectReadModel {
  constructor(
    public readonly isInProgress: boolean,
    public readonly isCompleted: boolean,
    public readonly gameState: AttemptGameStateReadModel | null,
  ) {}
}