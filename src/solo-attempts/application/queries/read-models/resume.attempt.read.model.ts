export class NextSlideReadModel {
  constructor(
    public readonly slideId: string,
    public readonly mediaId: string | null,
    public readonly questionType: string,
    public readonly questionText: string,
    public readonly timeLimitSeconds: number,
    // We map the options to a simple structure as requested by the API
    public readonly options: Array<{
      index: number;
      text: string | null;
      mediaId: string | null;
    }>,
  ) {}
}

export class AttemptResumeReadModel {
  constructor(
    public readonly attemptId: string,
    public readonly state: string, // 'IN_PROGRESS' | 'COMPLETED'
    public readonly currentScore: number,
    // This field is optional because if the game is COMPLETED, there is no next slide
    public readonly nextSlide: NextSlideReadModel | null,
  ) {}
} 